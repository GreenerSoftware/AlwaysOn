import {type Request} from '@hapi/hapi';
import {type ApplicationModel} from '../../application-model';
import {type ApplicationConfig} from '../../application-config';
import {viewModelBuilder, type Errors, type ViewModel} from '../view-model';

interface ApplicantDetailsViewModel extends ViewModel {
  isOnBehalf: boolean | undefined;
  name: string | undefined;
  organisation: string | undefined;
  emailAddress: string | undefined;
  phoneNumber: string | undefined;
}

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
const whatIsYourEmailViewModelBuilder = async (
  request: Request,
  backUrl: string | undefined,
  model: ApplicationModel,
  config: ApplicationConfig,
  error?: Errors,
): Promise<ApplicantDetailsViewModel> => {
  const applicantDetailsViewModel = (await viewModelBuilder(
    request,
    backUrl,
    model,
    config,
    error,
  )) as ApplicantDetailsViewModel;

  applicantDetailsViewModel.name = model.applicantName;
  applicantDetailsViewModel.organisation = model.applicantOrganisation;
  applicantDetailsViewModel.emailAddress = model.applicantEmailAddress;
  applicantDetailsViewModel.phoneNumber = model.applicantPhoneNumber;

  return applicantDetailsViewModel;
};

export {whatIsYourEmailViewModelBuilder};
