import {
  type ServerRoute,
  type Lifecycle,
  type Utils,
  type Request,
  type RouteOptions,
  type ResponseToolkit,
  type ResponseObject,
} from '@hapi/hapi';
import {type RequestQuery} from 'hapi';
import {ReturnState} from '../return-state';
import {type ApplicationModel} from '../application-model';
import {type ApplicationConfig} from '../application-config';
import {type Controller} from '../controller';
import {buildQueryParameters} from '../utils/build-query-parameters';
import {fixQueryParameters} from '../utils/fix-query-parameters';
import * as pageUrls from './page-urls';
import {type ViewModel, type Errors} from './view-model';
import {AllowedPageOverrides} from './allowed-page-overrides';

type HandlerParameters = {
  parameters: PageParameters;
  model: ApplicationModel;
  previousPage: string;
  previousPages: string[];
};

export type HandlerFunction = (
  request: Request,
  h: ResponseToolkit,
  handlerParameters: HandlerParameters,
) => Promise<ResponseObject>;

/**
 * Configuration of a M-VM-V-C pattern page.
 */
type PageParameters = {
  /**
   * Where to serve this page from.
   */
  path: string;

  /**
   * Which `View` file to use to render this page.
   */
  view: string;

  /**
   * Which `ViewModel` to use to extract the values required to render this
   * page.
   */
  viewModel: (
    request: Request,
    backUrl: string | undefined,
    model: ApplicationModel,
    config: ApplicationConfig,
    error?: Errors,
  ) => Promise<ViewModel>;

  /**
   * Which `Controller to use to handle the `get` and `post` events sent to this
   * page, including checking for errors and making decisions.
   */
  controller: Controller;

  /**
   * Any extra hapi `RouteOptions`. This will mostly be unused.
   */
  options?: RouteOptions;

  /**
   * What page must a visitor have previously visited to allow access to this
   * one. When multiple values are supplied in the array we check if they've
   * visited any one of them **not** that they've visited all of them.
   */
  guardAllowPrevious: string[] | undefined;

  /**
   * Where can this page lead the visitor next?
   */
  nextPaths: {
    /**
     * The main forward direction. Used by pages that only have one direction to
     * go to, or when the visitor picks the main route through the app when
     * given a choice of paths.
     */
    primary: string | undefined;

    /**
     * An optional second path for when the visitor picks an alternative route
     * through the app.
     */
    secondary?: string;

    /**
     * An optional third path for when the visitor picks an alternative route
     * through the app.
     */
    tertiary?: string;

    /**
     * An optional fourth path for when the visitor picks an alternative route
     * through the app.
     */
    quaternary?: string;
    /**
     * An optional fifth path for when the visitor picks an alternative route
     * through the app.
     */
    quinary?: string;
  };

  /**
   * Our injectable configuration object. This is cleaner than doing a run-time
   * global lookup for test vs prod options.
   */
  config?: ApplicationConfig;

  customPostHandler?: HandlerFunction;
  customGetHandler?: HandlerFunction;
};

/**
 * The parameters passed to the `getHandler` and `postHandler` functions.
 */

const getViewModel = async (
  request: Request,
  page: string,
  parameters: PageParameters,
  model: ApplicationModel,
  errors: Errors | undefined = undefined,
): Promise<ViewModel> => {
  const viewModelResult = await parameters.viewModel(request, page, model, parameters.config!, errors);
  return {...viewModelResult, feedbackUrl: parameters.config?.feedbackUrl};
};

/**
 * Generic GET handler for all pages.
 * @param {Request} request Incoming request.
 * @param {ResponseToolkit} h Response object.
 * @param {HandlerParameters} handlerParameters The handler parameters.
 * @returns {ResponseObject} Response object.
 */
const getHandler = async (request: Request, h: ResponseToolkit, handlerParameters: HandlerParameters) => {
  const {parameters, model, previousPage, previousPages} = handlerParameters;

  const query = fixQueryParameters(request.query) as RequestQuery;
  // We only have a 'new previous page' if we're going backwards through
  // the app. An `undefined` value signals we've not got a 'new' one.
  let newPreviousPage: string | undefined;

  const overRiddenPage = request.yar.flash('nextPageOverride');
  if (overRiddenPage?.length > 0) {
    const page = overRiddenPage[0] as string;

    if (Object.keys(AllowedPageOverrides).includes(page)) {
      const finalPage = AllowedPageOverrides[page as keyof typeof AllowedPageOverrides].slice(1);
      return h.redirect(finalPage);
    }
  }

  // If we're going backwards through the app, we'll need to 'adjust
  // history'.
  if (query.action === 'back') {
    if (query.backPage) {
      request.yar.flash('nextPageOverride', query.backPage);

      delete query.backPage;
    }

    delete query.action;
    const queryParameterString = buildQueryParameters(query as Record<string, string>);
    const lastVisitIndex = previousPages.lastIndexOf(`${parameters.path}${queryParameterString}`);
    const newPreviousPages = [...previousPages.slice(0, lastVisitIndex), ...previousPages.slice(lastVisitIndex + 1)];
    request.yar.set('previousPages', newPreviousPages);
    // We'll be rendering the 'already previous' page, so we need to find
    // out what the 'previous previous' or 'new previous' page is for the
    // back link.
    newPreviousPage = newPreviousPages.at(-1);
  }

  // Render the requested page, using the 'new previous' page if we're
  // going backwards, or the normal 'previous' page if we're in the
  // correct direction.
  try {
    const viewModel: ViewModel = await getViewModel(
      {...request, query} as Request,
      newPreviousPage ?? previousPage,
      parameters,
      model,
    );
    return h.view(parameters.view, viewModel);
  } catch (error: unknown) {
    console.error(error);
    return h.view('error-500').code(500);
  }
};

/**
 * Generic POST handler for all pages.
 * @param {Request} request Incoming request.
 * @param {ResponseToolkit} h Response object.
 * @param {HandlerParameters} handlerParameters The handler parameters.
 */

const postHandler = async (request: Request, h: ResponseToolkit, handlerParameters: HandlerParameters) => {
  const {parameters, model, previousPage, previousPages} = handlerParameters;

  const fixedQueryParameters = fixQueryParameters(request.query);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const fixedRequest: Request = {...request, query: fixedQueryParameters} as Request;

  const decision = await parameters.controller.handle(fixedRequest, parameters.config);

  // If the controller tells us we're broken, check for the errors, then
  // render the error-ful page.
  if (decision.state === ReturnState.ValidationError) {
    const errors = parameters.controller.checkErrors(fixedRequest);
    const viewModel: ViewModel = await getViewModel(fixedRequest, previousPage, parameters, model, errors);
    return h.view(parameters.view, viewModel);
  }

  if (decision.state === ReturnState.Redirect) {
    return h.redirect(decision.redirectLink);
  }

  // If we make it this far, we're OK, so save this page to the list of
  // previous pages for later.

  // remove the action param
  delete fixedRequest.query.action;

  const queryParameterString = buildQueryParameters(fixedRequest.query);
  previousPages.push(`${parameters.path}${queryParameterString}`);
  request.yar.set('previousPages', previousPages);

  // If our controller handler told us that we were to take the quinary
  // path, redirect there.
  if (decision.state === ReturnState.Quinary) {
    return h.redirect(`${parameters.config?.pathPrefix ?? ''}${parameters.nextPaths.quinary ?? '/'}`);
  }

  // If our controller handler told us that we were to take the quaternary
  // path, redirect there.
  if (decision.state === ReturnState.Quaternary) {
    return h.redirect(`${parameters.config?.pathPrefix ?? ''}${parameters.nextPaths.quaternary ?? '/'}`);
  }

  // If our controller handler told us that we were to take the tertiary
  // path, redirect there.
  if (decision.state === ReturnState.Tertiary) {
    return h.redirect(`${parameters.config?.pathPrefix ?? ''}${parameters.nextPaths.tertiary ?? '/'}`);
  }

  // If our controller handler told us that we were to take the secondary
  // path, redirect there.
  if (decision.state === ReturnState.Secondary) {
    return h.redirect(`${parameters.config?.pathPrefix ?? ''}${parameters.nextPaths.secondary ?? '/'}`);
  }

  // If we made it this far then we've passed all the filters above, so it's
  // time to move forward!
  return h.redirect(`${parameters.config?.pathPrefix ?? ''}${parameters.nextPaths.primary ?? '/'}`);
};

/**
 * Determine whether a visitor is allowed to view a page.
 * @param {string[]} previousPages A list of pages the visitor has previously
 * accessed.
 * @param {string[] | undefined} guardAllowPrevious A list of pages of which the
 * visitor must have accessed at least one before viewing this page.
 * @returns {boolean} `true` if the visitor is allowed to view this page,
 * `false` otherwise.
 */
const guardAllows = (previousPages: string[], guardAllowPrevious: string[] | undefined): boolean => {
  // `undefined` is the flag value for pages that can be visited at any time,
  // therefore just return `true`. Let it work for an empty array too.
  if (guardAllowPrevious === undefined || guardAllowPrevious.length === 0) {
    return true;
  }

  // If we've got no previous pages, then we're still blocked.
  if (previousPages === undefined || previousPages.length === 0) {
    return false;
  }

  // Check to see if any of our allowed previous pages occurs in the stored
  // previous pages list. If there is one, then we're allowed through!
  for (const allowedPrevious of guardAllowPrevious) {
    if (
      previousPages.filter((page) => {
        return page.includes(allowedPrevious);
      })
    ) {
      return true;
    }
  }

  // The default, fall-through, behaviour is to be blocked.
  return false;
};

type CustomHandlers = {
  customPostHandler?: HandlerFunction;
  customGetHandler?: HandlerFunction;
};

/**
 * A `Page` represents one cycle around our Model -> ViewModel -> View ->
 * Controller pattern. It mounts a get and a post responder at a path under a
 * Hapi server and handles the logic required within a page and between pages.
 */
class Page implements ServerRoute, CustomHandlers {
  path: string;
  method: Utils.HTTP_METHODS_PARTIAL | Utils.HTTP_METHODS_PARTIAL[];
  handler?: Lifecycle.Method;
  options?: RouteOptions;
  customPostHandler?: HandlerFunction;
  customGetHandler?: HandlerFunction;

  /**
   * Build a M-VM-V-C pattern page.
   * @param {PageParameters} parameters The configuration of this page.
   */
  constructor(parameters: PageParameters) {
    this.path = `${parameters.config?.pathPrefix ?? ''}${parameters.path}`;
    this.method = ['get', 'post'];
    this.handler = async (request: Request, h: ResponseToolkit) => {
      // Get the model from the visitor's session.
      let model = (request.yar.get('applicationModel') ?? {}) as ApplicationModel;

      // If we are mocking, and the session model is empty, give it initial data.
      if (parameters.config?.mockApplicationModel && Object.keys(model).length === 0) {
        model = request.yar.set('applicationModel', parameters.config.mockApplicationModel);

        // Set the previous pages in the session to every page that exists in the pageUrls.
        request.yar.set('previousPages', Object.values(pageUrls));
      }

      // Grab the list of of previous pages from the visitor's session.
      const previousPages = (request.yar.get('previousPages') ?? []) as string[];
      const previousPage = previousPages.at(-1);

      // If we're not allowed to visit this page, give the visitor a 403 error.
      if (!guardAllows(previousPages, parameters.guardAllowPrevious)) {
        return h.view('error-403').code(403);
      }

      const handlerParameters: HandlerParameters = {
        parameters,
        model,
        previousPage: previousPage!,
        previousPages,
      };

      // If we're allowed, and we're just getting the page, build a view-model
      // and render the view.
      if (request.method === 'get') {
        return this.customGetHandler
          ? this.customGetHandler(request, h, handlerParameters)
          : getHandler(request, h, handlerParameters);
      }

      return this.customPostHandler
        ? this.customPostHandler(request, h, handlerParameters)
        : postHandler(request, h, handlerParameters);
    };

    this.options = parameters.options;
  }
}

export {type PageParameters, guardAllows, Page};
