import {type ApplicationConfig} from '../../application-config';
import {Page} from '../page';
import {welcome as pathUrl, whatIsYourEmail as primaryPath} from '../page-urls';
import {welcomeViewModelBuilder} from './01-welcome.model';
import {welcomeController} from './01-welcome.controller';

/**
 * Build our app's welcome page.
 * @param {ApplicationConfig} config Our application's configuration.
 * @returns {Page} Our app's welcome page.
 */
const welcomePage = (config: ApplicationConfig): Page => {
  return new Page({
    // One of these pages must have been previously visited or we throw an error.
    guardAllowPrevious: undefined,

    // The path the page is serving on
    path: pathUrl,

    // We only have one way forward.
    nextPaths: {
      // This is the next page when we return a primary return state.
      primary: primaryPath,
    },

    // The nunjucks view for this page.
    view: '01-welcome',

    // The view model for this page.
    viewModel: welcomeViewModelBuilder,

    // The controller for this page.
    controller: welcomeController,

    // The global app configuration.
    config,
  });
};

export {welcomePage};
