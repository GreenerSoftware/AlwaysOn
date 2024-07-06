/**
 * Cleans and sanitises a 'yes'/'no' pair of radio buttons.
 * @param {string | undefined} dirty A form field that should be 'yes',
 * 'no' or undefined as set by a pair of radio buttons.
 * @returns {boolean | undefined} True if dirty is 'yes', false if dirty is
 * 'no', undefined otherwise.
 */
const cleanRadioBoolean = (dirty: string | undefined): boolean | undefined => {
  if (dirty === 'yes') {
    return true;
  }

  if (dirty === 'no') {
    return false;
  }

  return undefined;
};

/**
 * Cleans and sanitises a string form field.
 * @param {string | undefined} dirty A user-entered string from an
 * incoming form.
 * @returns {string | undefined} A trimmed string, or undefined.
 */
const cleanInputString = (dirty: string | undefined): string | undefined => {
  if (dirty !== undefined && typeof dirty === 'string' && dirty.trim() !== '') {
    return dirty.trim();
  }

  return undefined;
};

/**
 * Process a string in to either it's non-negative integer `number`
 * representation or return `undefined`.
 * @param {string | undefined} dirtyValue The user's supplied integer value.
 * @returns {number | undefined} The cleaned, non-negative, integer value.
 */
const cleanNonNegativeInteger = (dirtyValue: string | undefined) => {
  const trimmedValue = cleanInputString(dirtyValue);
  if (trimmedValue === undefined) {
    return undefined;
  }

  // Check we're only receiving digits, not text, negative numbers or floats.
  if (!/^\d+$/.test(trimmedValue)) {
    return undefined;
  }

  // Check it does actually parse correctly.
  const valueAsNumber = Number.parseInt(trimmedValue, 10);
  if (Number.isNaN(valueAsNumber)) {
    return undefined;
  }

  // Return the fully validated integer value.
  return valueAsNumber.valueOf();
};

/**
 * Cleans and sanitises a form field that was submitted from multiple,
 * related checkboxes.
 *
 * A multi-select checkbox returns one of the following.
 *
 * - `undefined` if none of it's options are selected.
 * - `'value1'` if one option is selected.
 * - `['value1', 'value3']` if multiple options are selected.
 * This compares an incoming value against a list of potential values
 * (one per checkbox) and returns whether the form value matches any or
 * all of them.
 * @example
 * <input name="choice" type="checkbox" value="value1">
 * <input name="choice" type="checkbox" value="value2">
 * @example
 * const [choiceValue1, choiceValue2] = cleanMultipleCheckboxes(form.choice,['value1', 'value2']);
 * @param {string | string[] | undefined} formValues The value from the
 * parsed form.
 * @param {string[]} potentialValues A list of values the multi-checkbox
 * might take.
 * @returns {boolean[]} An array of booleans of whether the potential
 * values were selected on the form or not.
 */
const cleanMultiCheckboxBooleans = (
  formValues: string | string[] | undefined,
  potentialValues: string[],
): boolean[] => {
  // This field is missing, so all checkboxes are un-checked.
  if (formValues === undefined) {
    // Return an array the same size as `values`, but all false.
    return potentialValues.map((_value) => {
      return false;
    });
  }

  // If it's a string, then we've got one checkbox ticked.
  if (typeof formValues === 'string') {
    // Return true for the one we've got, otherwise false.
    return potentialValues.map((value) => {
      return formValues.includes(value);
    });
  }

  // It's an array of strings, so we've got more than one checkbox
  // ticked, return true for each that's ticked, otherwise false.
  return potentialValues.map((value) => {
    return formValues.includes(value);
  });
};

const formUtils = {cleanRadioBoolean, cleanInputString, cleanNonNegativeInteger, cleanMultiCheckboxBooleans};

export {formUtils};
