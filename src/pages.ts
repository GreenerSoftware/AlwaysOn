import {type ServerRoute} from '@hapi/hapi';
import {type ApplicationConfig} from './application-config';
import {welcomePage} from './pages/01-welcome/01-welcome.page';
import whatIsYourEmailPage from './pages/20-personal-details/20-personal-details.page';
import checkYourAnswersAnnualPage from './pages/100-check-your-answers-annual/100-check-your-answers-annual.page';
import cullSubmittedAnnualPage from './pages/40-submitted/40-submitted.page';

const pages = (config: ApplicationConfig): ServerRoute[] => {
  return [
    {
      path: `${config.pathPrefix}/`,
      method: ['get', 'post'],
      handler(request: any, h: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return h.redirect(`${config.pathPrefix}/submit`);
      },
    },
    ...[welcomePage, whatIsYourEmailPage, checkYourAnswersAnnualPage, cullSubmittedAnnualPage].map((page) => {
      return page(config);
    }),
  ];
};

export {pages};
