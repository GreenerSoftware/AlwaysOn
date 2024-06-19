import {licenceReferencePrefix} from '../application-config';

/**
 * Formats a licence reference number from a licence ID, zero-padding to 5 digits where required.
 * @param {string | undefined} licenceNumberString A string containing a licence number to format.
 * @returns {string} The formatted Licence Reference Number.
 */
const formatLicenceReferenceNumber = (licenceNumberString: string | undefined): string => {
  // Return early if number string is empty.
  if (!licenceNumberString) {
    return '';
  }

  return `${licenceReferencePrefix}${licenceNumberString.padStart(5, '0')}`;
};

const capitalise = (word: string): string => {
  return `${word[0].toUpperCase()}${word.slice(1, word.length)}`;
};

/**
 * Split a date object into day, month and year and format for output.
 *
 * @param {Date} date A Date object.
 * @returns {string} Returns a string containing the day, month and year in an alternative format.
 */
const standardDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export {formatLicenceReferenceNumber, capitalise, standardDate};
