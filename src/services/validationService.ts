// src/services/validationService.ts
import { isBefore, parseISO } from 'date-fns';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidation {
  field: string;
  value: any;
  rules: ValidationRule[];
}

/**
 * Validações específicas para email
 */
export const emailValidation: ValidationRule = {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Email deve ter um formato válido'
};

/**
 * Validações específicas para senha
 */
export const passwordValidation: ValidationRule = {
  required: true,
  minLength: 6,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  message: 'Senha deve ter pelo menos 6 caracteres, incluindo maiúscula, minúscula e número'
};

/**
 * Validações específicas para nome
 */
export const nameValidation: ValidationRule = {
  required: true,
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  message: 'Nome deve conter apenas letras e espaços, entre 2 e 50 caracteres'
};

/**
 * Validações específicas para código de organização
 */
export const orgCodeValidation: ValidationRule = {
  required: true,
  pattern: /^[A-Z0-9]{6}$/,
  message: 'Código deve ter exatamente 6 caracteres alfanuméricos maiúsculos'
};

/**
 * Validações específicas para datas
 */
export const dateValidation: ValidationRule = {
  required: true,
  custom: (value: string) => {
    if (!value) return 'Data é obrigatória';
    
    const date = parseISO(value);
    if (isNaN(date.getTime())) {
      return 'Data deve ter um formato válido';
    }
    
    return null;
  }
};

/**
 * Validações específicas para datas futuras
 */
export const futureDateValidation: ValidationRule = {
  required: true,
  custom: (value: string) => {
    if (!value) return 'Data é obrigatória';
    
    const date = parseISO(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) {
      return 'Data deve ser futura';
    }
    
    return null;
  }
};

/**
 * Validações específicas para período de férias
 */
export const vacationPeriodValidation: ValidationRule = {
  required: true,
  custom: (value: { startDate: string; endDate: string }) => {
    if (!value.startDate || !value.endDate) {
      return 'Datas de início e fim são obrigatórias';
    }
    
    const startDate = parseISO(value.startDate);
    const endDate = parseISO(value.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(startDate, today)) {
      return 'Data de início deve ser futura';
    }
    
    if (isBefore(endDate, startDate)) {
      return 'Data de fim deve ser posterior à data de início';
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return 'Período de férias não pode exceder 30 dias';
    }
    
    return null;
  }
};

/**
 * Validações específicas para arquivos de avatar
 */
export const avatarFileValidation: ValidationRule = {
  required: false,
  custom: (file: File) => {
    if (!file) return null;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP';
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 5MB';
    }
    
    return null;
  }
};

/**
 * Validações específicas para idade
 */
export const ageValidation: ValidationRule = {
  required: false,
  custom: (value: number) => {
    if (value === undefined || value === null) return null;
    
    if (value < 16 || value > 100) {
      return 'Idade deve estar entre 16 e 100 anos';
    }
    
    return null;
  }
};

/**
 * Validações específicas para telefone
 */
export const phoneValidation: ValidationRule = {
  required: false,
  pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  message: 'Telefone deve estar no formato (11) 99999-9999'
};

/**
 * Validações específicas para CPF
 */
export const cpfValidation: ValidationRule = {
  required: false,
  custom: (value: string) => {
    if (!value) return null;
    
    // Remove caracteres não numéricos
    const cpf = value.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return 'CPF inválido';
    }
    
    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return 'CPF inválido';
    }
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return 'CPF inválido';
    }
    
    return null;
  }
};

/**
 * Valida um campo individual
 */
export const validateField = (field: string, value: any, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    // Verificar se é obrigatório
    if (rule.required && (value === undefined || value === null || value === '')) {
      return rule.message || `${field} é obrigatório`;
    }
    
    // Se o valor está vazio e não é obrigatório, pular outras validações
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Verificar comprimento mínimo
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message || `${field} deve ter pelo menos ${rule.minLength} caracteres`;
    }
    
    // Verificar comprimento máximo
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message || `${field} deve ter no máximo ${rule.maxLength} caracteres`;
    }
    
    // Verificar padrão regex
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || `${field} tem formato inválido`;
    }
    
    // Verificar validação customizada
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }
  }
  
  return null;
};

/**
 * Valida múltiplos campos
 */
export const validateFields = (validations: FieldValidation[]): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  for (const validation of validations) {
    const error = validateField(validation.field, validation.value, validation.rules);
    if (error) {
      errors[validation.field] = error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Validações específicas para formulários
 */
export const formValidations = {
  // Formulário de login
  login: (data: { email: string; password: string }) => {
    return validateFields([
      { field: 'email', value: data.email, rules: [emailValidation] },
      { field: 'password', value: data.password, rules: [passwordValidation] }
    ]);
  },
  
  // Formulário de registro
  signup: (data: { email: string; password: string; name: string; orgCode?: string }) => {
    return validateFields([
      { field: 'email', value: data.email, rules: [emailValidation] },
      { field: 'password', value: data.password, rules: [passwordValidation] },
      { field: 'name', value: data.name, rules: [nameValidation] },
      { field: 'orgCode', value: data.orgCode, rules: [orgCodeValidation] }
    ]);
  },
  
  // Formulário de perfil
  profile: (data: { name?: string; age?: number; phone?: string; cpf?: string }) => {
    return validateFields([
      { field: 'name', value: data.name, rules: [nameValidation] },
      { field: 'age', value: data.age, rules: [ageValidation] },
      { field: 'phone', value: data.phone, rules: [phoneValidation] },
      { field: 'cpf', value: data.cpf, rules: [cpfValidation] }
    ]);
  },
  
  // Formulário de férias
  vacation: (data: { startDate: string; endDate: string; reason?: string }) => {
    return validateFields([
      { field: 'period', value: { startDate: data.startDate, endDate: data.endDate }, rules: [vacationPeriodValidation] },
      { field: 'reason', value: data.reason, rules: [{ maxLength: 500, message: 'Motivo deve ter no máximo 500 caracteres' }] }
    ]);
  },
  
  // Formulário de organização
  organization: (data: { name: string; description?: string }) => {
    return validateFields([
      { field: 'name', value: data.name, rules: [{ required: true, minLength: 2, maxLength: 100, message: 'Nome da organização deve ter entre 2 e 100 caracteres' }] },
      { field: 'description', value: data.description, rules: [{ maxLength: 500, message: 'Descrição deve ter no máximo 500 caracteres' }] }
    ]);
  },
  
  // Formulário de colaborador
  collaborator: (data: { email: string; name: string; role: string; department?: string }) => {
    return validateFields([
      { field: 'email', value: data.email, rules: [emailValidation] },
      { field: 'name', value: data.name, rules: [nameValidation] },
      { field: 'role', value: data.role, rules: [{ required: true, message: 'Função é obrigatória' }] },
      { field: 'department', value: data.department, rules: [{ maxLength: 100, message: 'Departamento deve ter no máximo 100 caracteres' }] }
    ]);
  }
};

/**
 * Sanitiza dados de entrada
 */
export const sanitizeInput = (value: any): any => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

/**
 * Formata dados para exibição
 */
export const formatForDisplay = {
  cpf: (value: string) => {
    if (!value) return '';
    const cpf = value.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  phone: (value: string) => {
    if (!value) return '';
    const phone = value.replace(/\D/g, '');
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  },
  
  orgCode: (value: string) => {
    if (!value) return '';
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
};
