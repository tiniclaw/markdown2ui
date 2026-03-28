import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AST, Block } from '@markdown2ui/parser';

export interface FormValues {
  [id: string]: any;
}

export interface FormContextValue {
  values: FormValues;
  setValue: (id: string, value: any) => void;
  errors: Record<string, string>;
}

const FormContext = createContext<FormContextValue>({
  values: {},
  setValue: () => {},
  errors: {},
});

export function useFormState(): FormContextValue {
  return useContext(FormContext);
}

function initializeValues(blocks: Block[]): FormValues {
  const values: FormValues = {};

  for (const block of blocks) {
    if (block.type === 'group') {
      Object.assign(values, initializeValues(block.children));
      continue;
    }

    const b = block as any;
    const id = b.id;
    if (!id) continue;

    switch (block.type) {
      case 'single-select': {
        const defaultOpt = b.options.find((o: any) => o.default);
        values[id] = defaultOpt?.text ?? b.options[0]?.text;
        break;
      }
      case 'multi-select': {
        values[id] = b.options.filter((o: any) => o.selected).map((o: any) => o.text);
        break;
      }
      case 'sequence':
        values[id] = [...b.items];
        break;
      case 'confirmation':
        values[id] = false;
        break;
      case 'text-input':
        values[id] = b.prefill ?? '';
        break;
      case 'typed-input':
        values[id] = b.prefill ?? '';
        break;
      case 'slider':
        values[id] = b.default;
        break;
      case 'date':
      case 'time':
      case 'datetime': {
        if (b.default && b.default !== 'NOW') {
          values[id] = b.default;
        } else {
          const now = new Date();
          if (block.type === 'date') values[id] = now.toISOString().slice(0, 10);
          else if (block.type === 'time') values[id] = now.toTimeString().slice(0, 5);
          else values[id] = now.toISOString().slice(0, 16);
        }
        break;
      }
      case 'file-upload':
      case 'image-upload':
        values[id] = undefined;
        break;
    }
  }

  return values;
}

function validateForm(blocks: Block[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const block of blocks) {
    if (block.type === 'group') {
      Object.assign(errors, validateForm(block.children, values));
      continue;
    }

    const b = block as any;
    if (!b.required || !b.id) continue;

    const value = values[b.id];

    switch (block.type) {
      case 'text-input':
      case 'typed-input':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[b.id] = 'This field is required';
        }
        break;
      case 'multi-select':
        if (!Array.isArray(value) || value.length === 0) {
          errors[b.id] = 'Select at least one option';
        }
        break;
      case 'file-upload':
      case 'image-upload':
        if (!value) {
          errors[b.id] = 'This field is required';
        }
        break;
      case 'date':
      case 'time':
      case 'datetime':
        if (!value) {
          errors[b.id] = 'This field is required';
        }
        break;
    }
  }

  return errors;
}

interface FormProviderProps {
  ast: AST;
  children: React.ReactNode;
  onSubmitReady?: (values: FormValues) => void;
}

export function FormProvider({ ast, children }: FormProviderProps) {
  const [values, setValues] = useState<FormValues>(() => initializeValues(ast.blocks));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = useCallback((id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const contextValue = useMemo<FormContextValue>(
    () => ({ values, setValue, errors }),
    [values, setValue, errors],
  );

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
}

export function useValidation(ast: AST) {
  const { values } = useFormState();

  return useCallback(() => {
    return validateForm(ast.blocks, values);
  }, [ast, values]);
}
