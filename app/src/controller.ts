import {type Request} from '@hapi/hapi';
import {type ApplicationConfig} from './application-config';
import {type Errors} from './pages/view-model';
import {type ReturnDecision} from './return-state';

/**
 * Controllers for pages validate incoming forms and decide which path to take
 * the visitor on next based on their answers.
 */
type Controller = {
  /**
   *
   * @param request
   */
  checkErrors(request: Request): Errors | undefined;

  /**
   * Handle the incoming form.
   * @param {Request} request The incoming form request.
   * @returns {Promise<ReturnDecision>} Resolves to a decision for onward movement in
   * the app, reloading the current page if there's an error or continuing to
   * another page based on the visitor's answer.
   */
  handle(request: Request, config?: ApplicationConfig): Promise<ReturnDecision>;
};

export type {Controller};
