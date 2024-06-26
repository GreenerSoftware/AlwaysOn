import {readdir} from 'node:fs/promises';
// Required to stand up the server.
import * as Hapi from '@hapi/hapi';
// Session storage.
import * as Yar from '@hapi/yar';
// Import our template engine.
import * as Vision from '@hapi/vision';
import * as Nunjucks from 'nunjucks';
// Allow static file serving.
import * as Inert from '@hapi/inert';
import {type ApplicationConfig} from './application-config';
import {pages} from './pages';

// Start up our micro-app.
const application = async (config: ApplicationConfig) => {
  const server = Hapi.server({
    port: 3305,
    host: '0.0.0.0',
    routes: {
      files: {
        relativeTo: '.',
      },
    },
  });

  // Do session cookies.
  await server.register({
    plugin: Yar,
    options: {
      storeBlank: false,
      name: 'deer-return',
      cookieOptions: {
        password: config.sessionSecret,
        isSecure: true,
        path: '/deer-return',
        isSameSite: 'Strict',
      },
    },
  });

  const getDirectories = async (source: string) => {
    try {
      const directories = await readdir(source, {withFileTypes: true});
      return directories
        .filter((dirent) => {
          return dirent.isDirectory();
        })
        .map((dirent) => {
          return `${source}/${dirent.name}`;
        });
    } catch {
      return [];
    }
  };

  const distributionPagesDirectories = await getDirectories('dist/pages');
  const sourcePagesDirectories = await getDirectories('src/pages');

  const viewsConfig: Vision.ServerViewsConfiguration = {
    engines: {
      njk: {
        compile(template: string, options: {environment: Nunjucks.Environment | undefined}) {
          const njk = Nunjucks.compile(template, options.environment);
          return (context: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return njk.render(context);
          };
        },
        prepare(config: {path: string; compileOptions: {environment: Nunjucks.Environment | undefined}}, next) {
          const njkEnvironment = Nunjucks.configure(config.path, {watch: false});
          config.compileOptions.environment = njkEnvironment;
          next();
        },
      },
    },
    path: [
      ...distributionPagesDirectories,
      ...sourcePagesDirectories,
      'views',
      'src/pages',
      'node_modules/govuk-frontend',
      'node_modules/naturescot-frontend',
    ],
  };
  await server.register(Vision);
  server.views(viewsConfig);

  // Tell hapi that it can serve static files.
  await server.register(Inert);

  // `health` is a simple health-check end-point to test whether the service is
  // up.
  server.route({
    method: 'GET',
    path: `${config.pathPrefix}/health`,
    handler() {
      return {message: 'OK'};
    },
    options: {
      auth: false,
    },
  });

  // Redirect to the intro page if there is no `/` on then end of the pathPrefix.
  server.route({
    method: 'GET',
    path: `${config.pathPrefix}`,
    handler(request, h) {
      return h.redirect(`${config.pathPrefix}/submit`);
    },
  });

  server.route(pages(config));

  server.route([
    {
      method: 'GET',
      path: `${config.pathPrefix}/assets/{filename}`,
      handler: {
        directory: {
          path: 'assets',
        },
      },
    },
    {
      method: 'GET',
      path: `${config.pathPrefix}/govuk-frontend/assets/{filename*}`,
      handler: {
        directory: {
          path: 'node_modules/govuk-frontend/govuk/assets',
        },
      },
    },
    {
      method: 'GET',
      path: `${config.pathPrefix}/govuk-frontend/{filename*}`,
      handler: {
        directory: {
          path: 'node_modules/govuk-frontend/govuk',
        },
      },
    },
    {
      method: 'GET',
      path: `${config.pathPrefix}/naturescot-frontend/assets/{filename*}`,
      handler: {
        directory: {
          path: 'node_modules/naturescot-frontend/naturescot/assets',
        },
      },
    },
  ]);

  // Start the now fully configured HTTP server.
  await server.start();
  console.log(`Server listening on http://localhost:3305/deer-return`);
};

export {application};
