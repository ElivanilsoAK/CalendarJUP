// src/components/forms/ValidatedSelect.tsx
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  showValidationIcon?: boolean;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
}

const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  ({
    label,
    error,
    touched,
    showValidationIcon = true,
    helperText,
    options,
    placeholder,
    variant = 'default',
    size = 'md',
    leftIcon,
    className = '',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const hasError = touched && error;
    const hasSuccess = touched && !error && props.value;

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    const variantClasses = {
      default: `border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800`,
      filled: `border-0 bg-gray-100 dark:bg-gray-700`,
      outlined: `border-2 border-gray-300 dark:border-gray-600 bg-transparent`
    };

    const focusClasses = isFocused
      ? 'ring-2 ring-blue-500 border-blue-500'
      : hasError
      ? 'border-red-500 dark:border-red-400'
      : hasSuccess
      ? 'border-green-500 dark:border-green-400'
      : '';

    const selectClasses = `
      w-full rounded-lg transition-all duration-200 appearance-none cursor-pointer
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${focusClasses}
      ${hasError ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${leftIcon ? 'pl-10' : ''}
      pr-10
      ${className}
    `.trim();

    const renderValidationIcon = () => {
      if (!showValidationIcon || !touched) return null;

      if (hasError) {
        return <AlertCircle size={20} className="text-red-500" />;
      }

      if (hasSuccess) {
        return <CheckCircle size={20} className="text-green-500" />;
      }

      return null;
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            className={selectClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {renderValidationIcon() || <ChevronDown size={20} className="text-gray-400" />}
          </div>
        </div>

        {hasError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle size={16} />
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedSelect.displayName = 'ValidatedSelect';

export default ValidatedSelect;
