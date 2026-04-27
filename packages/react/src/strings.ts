export interface M2UStrings {
  // Validation errors
  fieldRequired: string;
  emailInvalid: string;
  urlInvalid: string;
  phoneInvalid: string;
  selectAtLeastOne: string;
  optionRequired: (optionText: string) => string;

  // File upload labels
  uploadFile: string;
  uploadImage: string;

  // Freestyle input placeholders
  singleSelectFreestyle: string;
  multiSelectFreestyle: string;

  // Repeatable group / table actions
  addItem: string;
  removeItem: string;
  addRow: string;
  removeRow: string;

  // Sequence accessibility
  moveUp: (itemLabel: string) => string;
  moveDown: (itemLabel: string) => string;
}

export const DEFAULT_STRINGS: M2UStrings = {
  fieldRequired: 'This field is required',
  emailInvalid: 'Enter a valid email',
  urlInvalid: 'Enter a valid URL',
  phoneInvalid: 'Enter a valid phone number',
  selectAtLeastOne: 'Select at least one option',
  optionRequired: (text) => `"${text}" is required`,
  uploadFile: 'Upload file',
  uploadImage: 'Upload image',
  singleSelectFreestyle: 'Or type your answer...',
  multiSelectFreestyle: 'Or add your own...',
  addItem: '+ Add item',
  removeItem: 'Remove',
  addRow: '+ Add row',
  removeRow: 'Remove row',
  moveUp: (label) => `Move ${label} up`,
  moveDown: (label) => `Move ${label} down`,
};
