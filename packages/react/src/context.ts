import { createContext, useContext } from 'react';
import type { ComponentType } from 'react';
import { DEFAULT_STRINGS, type M2UStrings } from './strings.js';

export type SubmitFormat = 'compact' | 'verbose';

export interface FormValues {
  [id: string]: any;
}

export type BlockRendererRegistry = Record<string, ComponentType<{ block: any }>>;

export interface FormContextValue {
  values: FormValues;
  setValue: (id: string, value: any) => void;
  errors: Record<string, string>;
  onSubmit?: (extra?: FormValues) => void;
  setGroupValue: (groupId: string, rowIndex: number, fieldId: string, value: any) => void;
  blockRenderers?: BlockRendererRegistry;
  strings: M2UStrings;
}

export const FormContext = createContext<FormContextValue>({
  values: {},
  setValue: () => {},
  errors: {},
  setGroupValue: () => {},
  strings: DEFAULT_STRINGS,
});

export function useFormContext() {
  return useContext(FormContext);
}
