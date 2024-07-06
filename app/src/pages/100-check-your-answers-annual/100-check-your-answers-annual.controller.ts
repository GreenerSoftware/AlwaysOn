import process from 'node:process';
import {type Request} from '@hapi/hapi';
import {type Errors} from '../view-model';
import {ReturnState, type ReturnDecision} from '../../return-state';
import {type Controller} from '../../controller';
import {type ApplicationModel} from '../../application-model';
import {type ApplicationConfig} from '../../application-config';

type FormData = {
  confirm: string;
};

const errorChecker = (request: Request): Errors | undefined => {
  const formData = request.payload as FormData;

  if (formData.confirm !== 'yes') {
    return {
      confirmIncorrectValue: true,
    };
  }

  return undefined;
};

const handler = async (request: Request, config: ApplicationConfig): Promise<ReturnDecision> => {
  const errors = errorChecker(request);

  if (errors) {
    return {state: ReturnState.ValidationError};
  }

  let model = (request.yar.get('applicationModel') ?? {}) as ApplicationModel;

  let returnsResponse;
  try {
    returnsResponse = await config.axios.post(`${config.apiEndpoint}/returns/property-return`, model);

    model = {};
    // // Save the confirmed property code to the now empty model.
    // model.propertyCodeConfirmation = returnsResponse.data.propertyCode as string;
    console.log(returnsResponse);

    // Save the application model to session storage.
    request.yar.set('applicationModel', model);
  } catch {
    // If something went wrong with the API call return an error object with the view model.
    const apiError = true;
    const errors: Errors = {
      apiError,
    };

    // Tell the visitor if there are any errors.
    if (errors && !process.env.UNDER_TEST) {
      return {state: ReturnState.ValidationError};
    }
  }

  // Clear the previous pages
  request.yar.set('previousPages', []);

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
