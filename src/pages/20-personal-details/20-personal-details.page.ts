import {type ApplicationConfig} from '../../application-config';
import {Page} from '../page';
import {whatIsYourEmail as pathUrl, checkYourAnswersAnnual as primaryPath, welcome as previousPage} from '../page-urls';
import {whatIsYourEmailViewModelBuilder} from './20-personal-details.model';
import {whatIsYourEmailController} from './20-personal-details.controller';

/**
 * Build our app's welcome page.
 * @param {ApplicationConfig} config Our application's configuration.
 * @returns {Page} Our app's welcome page.
 */
const page = (config: ApplicationConfig): Page => {
  return new Page({
    // One of these pages must have been previously visited or we throw an error.
    guardAllowPrevious: [previousPage],

    // The path the page is serving on
    path: pathUrl,

    // We only have one way forward.
    nextPaths: {
      // This is the next page when we return a primary return state.
      primary: primaryPath,
    },

    // The nunjucks view for this page.
    view: '20-personal-details',

    // The view model for this page.
    viewModel: whatIsYourEmailViewModelBuilder,

    // The controller for this page.
    controller: whatIsYourEmailController,

    // The global app configuration.
    config,
  });
};

export default page;
