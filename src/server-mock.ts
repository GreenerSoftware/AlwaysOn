import process from 'node:process';
import axios from 'axios';
import {application} from './application';
import {type ApplicationModel} from './application-model';
import {type ApplicationConfig} from './application-config';
import {setupAxiosMock} from './axios-mock';

/**
 * Determine whether to use a mock model based on command-line arguments.
 *
 * Arguments are passed on the node command-line: "node mock-server.js <useMockModel>".
 * @param {string[]} commandLineArguments Contains a single element 'true' to indicate a mock model is to be used.
 * @returns {boolean} 'true' if commandLineArguments contains a single element 'true'.
 */
const getMockModelMode = (commandLineArguments: string[]): boolean => {
  if (commandLineArguments.length > 1) {
    throw new Error(`Invalid arguments, should only be a maximum of one argument, got: ${commandLineArguments.length}`);
  }

  if (commandLineArguments.length === 0) {
    return false;
  }

  if (commandLineArguments[0].toString().toLocaleLowerCase() === 'true') {
    return true;
  }

  return false;
};

const mockApplicationModel: ApplicationModel = {
  applicantPersonId: 1234,
  seenCookie: false,
  applicantEmailAddress: 'john.doe@example.email',
  applicantOrganisation: 'Example Organisation',
  applicantPhoneNumber: '01234567890',
  applicantName: 'John Doe',
};

setupAxiosMock();

const applicationConfig: ApplicationConfig = {
  pathPrefix: '/deer-return',
  axios,
  apiEndpoint: 'http://mock-api/endpoint',
  gazetteerApiEndpoint: 'http://mock-gazetteer-api/endpoint',
  hostPrefix: 'http://localhost:3305',
  sessionSecret: 'mock-session-secret-of-more-than-32-characters-or-longer',
  feedbackUrl: 'https://www.google.com',
  underTest: Boolean(process.env.UNDER_TEST),
};

/**
 * A flag to indicate the use of mock model data, and the enabling of access to any page in any order.
 */
const isMockModelMode = getMockModelMode(process.argv.slice(2));

// If mock model flag set then add mock applicationModel to config.
if (isMockModelMode) {
  applicationConfig.mockApplicationModel = mockApplicationModel;
}

console.log(`
  Application Start --> http://localhost:3305/deer-return/submit
  using mock model?: ${isMockModelMode.toString()}
`);

// Start the micro-app and log any errors.
// eslint-disable-next-line unicorn/prefer-top-level-await
application(applicationConfig).catch((error: Error) => {
  console.log(error);
  throw error;
});
