// src/hooks/useValidation.ts
import { useState, useCallback, useMemo } from 'react';
import { 
  validateField, 
  validateFields, 
  formValidations, 
  sanitizeInput,
  type ValidationRule,
  type ValidationResult,
  type FieldValidation
} from '../services/validationService';

interface UseValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  sanitizeInputs?: boolean;
}

interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export const useValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>>,
  options: UseValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    sanitizeInputs = true
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [fieldStates, setFieldStates] = useState<Record<keyof T, FieldState>>(() => {
    const states: Record<keyof T, FieldState> = {} as any;
    Object.keys(initialValues).forEach(key => {
      states[key as keyof T] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false
      };
    });
    return states;
  });

  const validateSingleField = useCallback((fieldName: keyof T, value: any): string | null => {
    const rules = validationRules[fieldName];
    if (!rules) return null;
    
    const sanitizedValue = sanitizeInputs ? sanitizeInput(value) : value;
    return validateField(fieldName as string, sanitizedValue, rules);
  }, [validationRules, sanitizeInputs]);

  const validateAllFields = useCallback((): ValidationResult => {
    const validations: FieldValidation[] = [];
    
    Object.keys(values).forEach(key => {
      const fieldName = key as keyof T;
      const rules = validationRules[fieldName];
      if (rules) {
        validations.push({
          field: fieldName as string,
          value: values[fieldName],
          rules
        });
      }
    });
    
    return validateFields(validations);
  }, [values, validationRules]);

  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    const sanitizedValue = sanitizeInputs ? sanitizeInput(value) : value;
    
    setValues(prev => ({ ...prev, [fieldName]: sanitizedValue }));
    
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: sanitizedValue,
        dirty: true
      }
    }));

    // Validar em tempo real se habilitado
    if (validateOnChange) {
      const error = validateSingleField(fieldName, sanitizedValue);
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error
        }
      }));
    }
  }, [validateOnChange, validateSingleField, sanitizeInputs]);

  const setFieldTouched = useCallback((fieldName: keyof T) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true
      }
    }));

    // Validar ao perder foco se habilitado
    if (validateOnBlur) {
      const error = validateSingleField(fieldName, values[fieldName]);
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error
        }
      }));
    }
  }, [validateOnBlur, validateSingleField, values]);

  const setFieldError = useCallback((fieldName: keyof T, error: string | null) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error
      }
    }));
  }, []);

  const resetField = useCallback((fieldName: keyof T) => {
    setValues(prev => ({ ...prev, [fieldName]: initialValues[fieldName] }));
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        value: initialValues[fieldName],
        error: null,
        touched: false,
        dirty: false
      }
    }));
  }, [initialValues]);

  const resetAll = useCallback(() => {
    setValues(initialValues);
    setFieldStates(() => {
      const states: Record<keyof T, FieldState> = {} as any;
      Object.keys(initialValues).forEach(key => {
        states[key as keyof T] = {
          value: initialValues[key],
          error: null,
          touched: false,
          dirty: false
        };
      });
      return states;
    });
  }, [initialValues]);

  const validate = useCallback((): ValidationResult => {
    const result = validateAllFields();
    
    // Atualizar estados dos campos com erros
    setFieldStates(prev => {
      const newStates = { ...prev };
      Object.keys(result.errors).forEach(fieldName => {
        newStates[fieldName as keyof T] = {
          ...newStates[fieldName as keyof T],
          error: result.errors[fieldName],
          touched: true
        };
      });
      return newStates;
    });
    
    return result;
  }, [validateAllFields]);

  // Computed values
  const isValid = useMemo(() => {
    return Object.values(fieldStates).every(state => !state.error);
  }, [fieldStates]);

  const isDirty = useMemo(() => {
    return Object.values(fieldStates).some(state => state.dirty);
  }, [fieldStates]);

  const hasErrors = useMemo(() => {
    return Object.values(fieldStates).some(state => state.error);
  }, [fieldStates]);

  const errors = useMemo(() => {
    const errorObj: Record<keyof T, string | null> = {} as any;
    Object.keys(fieldStates).forEach(key => {
      errorObj[key as keyof T] = fieldStates[key as keyof T].error;
    });
    return errorObj;
  }, [fieldStates]);

  const touched = useMemo(() => {
    const touchedObj: Record<keyof T, boolean> = {} as any;
    Object.keys(fieldStates).forEach(key => {
      touchedObj[key as keyof T] = fieldStates[key as keyof T].touched;
    });
    return touchedObj;
  }, [fieldStates]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    hasErrors,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetField,
    resetAll,
    validate,
    fieldStates
  };
};

/**
 * Hook para validação de formulários específicos
 */
export const useFormValidation = <T extends Record<string, any>>(
  formType: keyof typeof formValidations,
  initialValues: T,
  options: UseValidationOptions = {}
) => {
  const validationRules = useMemo(() => {
    // Mapear regras específicas do formulário
    const rules: Partial<Record<keyof T, ValidationRule[]>> = {};
    
    switch (formType) {
      case 'login':
        rules.email = [{ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }];
        rules.password = [{ required: true, minLength: 6, message: 'Senha deve ter pelo menos 6 caracteres' }];
        break;
      case 'signup':
        rules.email = [{ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }];
        rules.password = [{ required: true, minLength: 6, message: 'Senha deve ter pelo menos 6 caracteres' }];
        rules.name = [{ required: true, minLength: 2, maxLength: 50, message: 'Nome deve ter entre 2 e 50 caracteres' }];
        break;
      case 'vacation':
        rules.startDate = [{ required: true, message: 'Data de início é obrigatória' }];
        rules.endDate = [{ required: true, message: 'Data de fim é obrigatória' }];
        break;
      // Adicionar outros tipos conforme necessário
    }
    
    return rules;
  }, [formType]);

  return useValidation(initialValues, validationRules, options);
};

/**
 * Hook para validação em tempo real
 */
export const useRealTimeValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>>
) => {
  return useValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    sanitizeInputs: true
  });
};
