import { createContext, useContext } from 'react';

export type SubmitFormat = 'compact' | 'verbose';

export interface FormValues {
  [id: string]: any;
}

export interface FormContextValue {
  values: FormValues;
  setValue: (id: string, value: any) => void;
  errors: Record<string, string>;
  onSubmit?: () => void;
}

export const FormContext = createContext<FormContextValue>({
  values: {},
  setValue: () => {},
  errors: {},
});

export function useFormContext() {
  return useContext(FormContext);
}
