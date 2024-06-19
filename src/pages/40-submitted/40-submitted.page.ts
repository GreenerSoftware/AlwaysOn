import {type ApplicationConfig} from '../../application-config';
import {Page} from '../page';
import {
  cullSubmittedAnnual as pathUrl,
  welcome as primaryPath,
  checkYourAnswersAnnual as previousPage,
} from '../page-urls';
import viewModel from './40-submitted.model';
import controller from './40-submitted.controller';

/**
 * Build our app's 110-cull-submitted-annual page.
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
    view: '40-submitted',

    // The view model for this page.
    viewModel,

    // The controller for this page.
    controller,

    // The global app configuration.
    config,
  });
};

export default page;
