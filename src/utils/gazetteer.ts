import {type ApplicationConfig} from '../application-config';

/**
 * A Gazetteer search result.
 */
type GazetteerAddress = {
  /**
   * The UPRN for the address.
   */
  uprn: number;

  /**
   * The one-liner, concatenated, version of the address.
   */
  summary_address: string;

  /**
   * How closely does this address match the search term?
   */
  matchscore: number;
};

// The `jobid` field can be `null` so disable this rule.
/* eslint-disable @typescript-eslint/ban-types */

/**
 * Metadata that comes with the response from the Gazetteer API.
 */
type GazetteerMetaData = {
  count: number;
  jobid: number | null;
  maxResults: number;
  queryTime: number;
  status: string;
  vintage: number;
};

/* eslint-enable @typescript-eslint/ban-types */

/**
 * The shape of the complete response as received from the Gazetteer API.
 */
type GazetteerData = {
  metadata: GazetteerMetaData;
  results: [
    {
      address: GazetteerAddress[];
    },
  ];
};

/**
 * Find addresses by postcode.
 * @param {ApplicationConfig} config Our application's configuration.
 * @param {string} postcode The postcode to find addresses by.
 * @returns {Promise<GazetteerAddress[]>} The list of matching addresses.
 */
const findAddressesByPostcode = async (config: ApplicationConfig, postcode: string): Promise<GazetteerAddress[]> => {
  // Lookup the postcode in our Gazetteer API.
  const apiResponse = await config.axios.get(config.gazetteerApiEndpoint, {
    params: {
      postcode,
    },
    timeout: 10_000,
  });

  // Grab the data as a typed response.
  const gazetteerResponse = apiResponse.data as GazetteerData;

  // A single string in the array rather than an array of objects indicates an
  // error where no addresses have been found.
  if (
    gazetteerResponse.metadata.count === 0 ||
    (gazetteerResponse.results.length === 1 && typeof gazetteerResponse.results[0] === 'string')
  ) {
    throw new Error('No matching addresses found.');
  }

  // Dig out the right array from the returned json blob.
  return gazetteerResponse.results[0].address;
};

/**
 * Find addresses by UPRN number.
 * @param {ApplicationConfig} config Our application's configuration.
 * @param {number} uprn The UPRN to find addresses by.
 * @returns {Promise<GazetteerAddress[]>} The list of matching addresses.
 */
const findAddressesByUprn = async (config: ApplicationConfig, uprn: number): Promise<GazetteerAddress[]> => {
  // Lookup the postcode in our Gazetteer API.
  const apiResponse = await config.axios.get(config.gazetteerApiEndpoint, {
    params: {
      uprn,
    },
    timeout: 10_000,
  });

  // Grab the data as a typed response.
  const gazetteerResponse = apiResponse.data as GazetteerData;

  // A single string in the array rather than an array of objects indicates an
  // error where no addresses have been found.
  if (
    gazetteerResponse.metadata.count === 0 ||
    (gazetteerResponse.results.length === 1 && typeof gazetteerResponse.results[0] === 'string')
  ) {
    throw new Error('No matching address found.');
  }

  // Dig out the right array from the returned json blob.
  return gazetteerResponse.results[0].address;
};

/**
 * Find Full address object by UPRN number.
 * @param {ApplicationConfig} config Our application's configuration.
 * @param {number} uprn The UPRN to find addresses by.
 * @returns {Promise<GazetteerAddress[]>} The list of matching addresses.
 */
const findFullAddressesByUprn = async (config: ApplicationConfig, uprn: number): Promise<any[]> => {
  // Lookup the postcode in our Gazetteer API.
  const apiResponse = await config.axios.get(config.gazetteerApiEndpoint, {
    params: {
      uprn,
      fieldset: 'all',
    },
    timeout: 10_000,
  });

  // Grab the data as a typed response.
  const gazetteerResponse = apiResponse.data as GazetteerData;

  // A single string in the array rather than an array of objects indicates an
  // error where no addresses have been found.
  if (
    gazetteerResponse.metadata.count === 0 ||
    (gazetteerResponse.results.length === 1 && typeof gazetteerResponse.results[0] === 'string')
  ) {
    throw new Error('No matching address found.');
  }

  // Dig out the right array from the returned json blob.
  return gazetteerResponse.results[0].address;
};

/**
 * Make calls to our Gazetteer API.
 */
const gazetteer = {findAddressesByPostcode, findAddressesByUprn, findFullAddressesByUprn};

export {gazetteer, type GazetteerAddress};
