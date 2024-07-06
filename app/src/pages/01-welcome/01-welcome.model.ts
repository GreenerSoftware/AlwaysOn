import {type Request} from '@hapi/hapi';
import {type ApplicationModel} from '../../application-model';
import {type ApplicationConfig} from '../../application-config';
import {viewModelBuilder, type Errors, type ViewModel} from '../view-model';

/**
 * We extend the base `ViewModel` to get the `backUrl` field and that's not even
 * really used as we can't actually go back from the first page.
 */
type WelcomeViewModel = Record<string, unknown> & ViewModel;

/**
 * Build our `WelcomeViewModel` from the `ApplicationModel`.
 * @param {Request} request The request.
 * @param {string | undefined} backUrl Where should the browser take the
 * visitor when they click the '< Back' link?
 * @param {ApplicationModel} model The `ApplicationModel` used to build this
 * `ViewModel`. We're not actually interested in any fields for this page.
 * @param {ApplicationConfig} config Our application's configuration.
 * @param {Errors | undefined} error Represents whether the controller found
 * any errors in a submission and is requesting a redisplay with appropriate
 * error messages.
 * @returns {Promise<WelcomeViewModel>} Our built IntroViewModel.
 */
const welcomeViewModelBuilder = async (
  request: Request,
  backUrl: string | undefined,
  model: ApplicationModel,
  config: ApplicationConfig,
  error?: Errors,
): Promise<WelcomeViewModel> => {
  const viewModel = await viewModelBuilder(request, undefined, model, config, error);

  return viewModel;
};

export {welcomeViewModelBuilder};
