import {type AxiosStatic} from 'axios';
import {type ApplicationModel} from './application-model';

/**
 * Our injectable configuration object. This is cleaner than doing a run-time
 * global lookup for test vs prod options.
 */
type ApplicationConfig = {
  /**
   * A mock ApplicationModel for use in testing.
   */
  mockApplicationModel?: ApplicationModel;

  /**
   * A path to host the app under.
   */
  pathPrefix: string;

  /**
   * An instance of Axios or an AxiosMockAdapter for testing purposes.
   */
  axios: AxiosStatic;

  /**
   * The API for posting our completed applications to.
   */
  apiEndpoint: string;

  /**
   * Where should we start building URLs from if we have to send them to a user
   * in an email, etc.
   */
  hostPrefix: string;

  /**
   * Session secret.
   */
  sessionSecret: string;

  /**
   * The Gazetteer API for conducting Postcode -> UPRN lookups.
   */
  gazetteerApiEndpoint: string;

  /**
   * Url for the feedback survey.
   */
  feedbackUrl: string;

  /**
   * Are we running tests?
   */
  underTest: boolean;
};
const licenceReferencePrefix = 'DEER-';

export type {ApplicationConfig};
export {licenceReferencePrefix};
