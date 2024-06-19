type DropdownOption = {
  value: string;
  text: string;
};

const monthArray: DropdownOption[] = [
  {
    value: '01',
    text: 'January',
  },
  {
    value: '02',
    text: 'February',
  },
  {
    value: '03',
    text: 'March',
  },
  {
    value: '04',
    text: 'April',
  },
  {
    value: '05',
    text: 'May',
  },
  {
    value: '06',
    text: 'June',
  },
  {
    value: '07',
    text: 'July',
  },
  {
    value: '08',
    text: 'August',
  },
  {
    value: '09',
    text: 'September',
  },
  {
    value: '10',
    text: 'October',
  },
  {
    value: '11',
    text: 'November',
  },
  {
    value: '12',
    text: 'December',
  },
];

const defaultDropdownOption: DropdownOption = {
  value: '',
  text: '',
};

/**
 * An array of strings containing the ordered months of the year.
 */
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export {monthArray, defaultDropdownOption, months};
