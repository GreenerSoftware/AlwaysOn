import {type Request} from '@hapi/hapi';
import {type ApplicationModel} from '../application-model';
import {type ApplicationConfig} from '../application-config';

type Errors = Record<string, boolean>;

/**
 * A `ViewModel` is the representation of application state, filtered and mapped
 * for the purpose of rendering a `View`.
 *
 * It is built by passing our `ApplicationModel` as well as some other
 * parameters and extracting and converting the values we need for the rendered
 * `View`.
 */
type ViewModel = {
  /**
   * Where should the browser take the visitor when they click the '< Back'
   * link? If `undefined` we treat this as 'no back link' and the template hides
   * the link from the visitor.
   */
  backUrl: string | undefined;

  /**
   * Where the cookie is seen only on the first page then is removed from
   * the rest of the pages thereafter.
   */
  seenCookie: boolean | undefined;

  /**
   * An object containing boolean flags to represent multiple errors that may
   * occur during a controller's error checking. If `undefined` we treat this as
   * if no errors have been found so we don't need to display the large error
   * summary at the top of the page, or the smaller in-line error messages.
   */
  error: Errors | undefined;

  /**
   * The URL that the feedback link will open (if the feedback banner is visible).
   * This is used on the base page template.
   */
  feedbackUrl?: string | undefined;

  /**
   * A url to redirect to on submission if using the redirect return state.
   */
  redirectUrl?: string | undefined;
};

/**
 * Build a `ViewModel` from the `ApplicationModel`.
 * @param {Request} _request The request.
 * @param {string | undefined} backUrl Where should the browser take the
 * visitor when they click the '< Back' link? If `undefined`, hide the link
 * from the visitor.
 * @param {ApplicationModel} _model The `ApplicationModel` used to build the
 * concrete `ViewModel`, unused in this abstract version of the class.
 * @param {ApplicationConfig} _config Our application's configuration.
 * @param {Errors | undefined} error An object containing boolean flags to
 * represent multiple errors that may occur during a controller's error
 * checking.
 * @returns {Promise<ViewModel>} Our built `ViewModel`.
 */
const viewModelBuilder = async (
  _request: Request,
  backUrl: string | undefined,
  _model: ApplicationModel,
  _config: ApplicationConfig,
  error?: Errors,
): Promise<ViewModel> => {
  const viewModel: ViewModel = {
    backUrl,
    error,
    seenCookie: _model.seenCookie,
  };

  return viewModel;
};

export {viewModelBuilder, type Errors, type ViewModel};
