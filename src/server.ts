import process from 'node:process';
import axios from 'axios';
import {application} from './application';

application({
  pathPrefix: '/deer-return',
  axios,
  apiEndpoint: process.env.DEER_API_URL ?? 'http://0.0.0.0:3301/deer-api/v1',
  hostPrefix: process.env.DEER_HOST_PREFIX ?? 'http://localhost:3305',
  sessionSecret: process.env.DEER_SESSION_SECRET ?? 'override_this_value_with_a_32_character_or_longer_secret',
  gazetteerApiEndpoint: process.env.PC_LOOKUP_API_URL ?? '',
  feedbackUrl: process.env.DEER_FEEDBACK_URL ?? 'https://www.google.com',
  underTest: Boolean(process.env.UNDER_TEST),
})
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch((error: Error) => {
    console.log(error);
    throw error;
  });
