import {recipients} from 'naturescot-utils';

/**
 * Check whether a string looks like a valid email address.
 * @param {string | undefined} emailAddress User input that should hopefully look like an email address.
 * @returns {boolean} `true` if the email address looks fine, otherwise `false`.
 */
const validEmailAddress = (emailAddress: string | undefined): boolean => {
  // The validateEmailAddress method is a port from GDS' python library whose
  // API returns if valid and throws if invalid. We wrap this here to return
  // true or false instead.
  try {
    recipients.validateEmailAddress(emailAddress ?? '');
    return true;
  } catch {
    return false;
  }
};

/**
 * Check whether a string looks like a valid phone number.
 * @param {string | undefined} phoneNumber User input that should hopefully look like a phone number.
 * @returns {boolean} `true` if the phone number looks fine, otherwise `false`.
 */
const validPhoneNumber = (phoneNumber: string | undefined): boolean => {
  // The validatePhoneNumber method is a port from GDS' python library,
  // modified slightly to hand land-line numbers, whose API returns if
  // valid and throws if invalid. We wrap this here to return true or
  // false instead.
  try {
    recipients.validatePhoneNumber(phoneNumber ?? '');
    return true;
  } catch {
    return false;
  }
};

const firstAndLastNameGiven = (nameInput: string): boolean => {
  // Accounts for three parts to a name and hyphens, eg Jean-Marc van Something-Something
  const regName = /^[-a-zA-Z]{2,}(?: [-a-zA-Z]+)+$/;

  if (!regName.test(nameInput)) {
    return false;
  }

  return true;
};

const validationUtils = {validEmailAddress, validPhoneNumber, firstAndLastNameGiven};

export {validationUtils};
