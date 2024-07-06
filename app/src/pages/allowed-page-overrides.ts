/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
import {checkYourAnswersAnnual, checkYourAnswersAuthorisation} from './page-urls';

export enum AllowedPageOverrides {
  'annual-check-your-answers' = checkYourAnswersAnnual,
  'authorisation-check-your-answers' = checkYourAnswersAuthorisation,
}
