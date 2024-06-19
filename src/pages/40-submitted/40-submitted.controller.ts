import {type Request} from '@hapi/hapi';
import {type Errors} from '../view-model';
import {ReturnState, type ReturnDecision} from '../../return-state';
import {type Controller} from '../../controller';

/**
 * Runs to check for errors on the page, and returns an errors object to pass
 * back to the view.
 * @param {Request} request A HTTP 'Request' object.
 * @returns {Errors | undefined} An errors object if errors are found, else undefined.
 */
const errorChecker = (request: Request): Errors | undefined => {
  return undefined;
};

/**
 * Decides what should happen when the page is posted.
 * It will return a ReturnState to determine the next page to go to.
 * @param {Request} request A HTTP 'Request' object.
 * @returns {Promise<ReturnState>} A ReturnState value that determines the next page to visit.
 */
const handler = async (request: Request): Promise<ReturnDecision> => {
  return {state: ReturnState.Primary};
};

/**
 * The full controller object.
 */
const controller: Controller = {
  checkErrors: errorChecker,
  handle: handler,
};

export default controller;
