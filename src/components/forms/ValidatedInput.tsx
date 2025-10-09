// src/components/forms/ValidatedInput.tsx
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  showValidationIcon?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'month';
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    error,
    touched,
    showValidationIcon = true,
    type = 'text',
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;
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

    const inputClasses = `
      w-full rounded-lg transition-all duration-200
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${focusClasses}
      ${hasError ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || showValidationIcon || type === 'password' ? 'pr-10' : ''}
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

    const renderPasswordToggle = () => {
      if (type !== 'password') return null;

      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      );
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

          <input
            ref={ref}
            type={inputType}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {renderPasswordToggle()}

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}

          {!rightIcon && !leftIcon && type !== 'password' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {renderValidationIcon()}
            </div>
          )}
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

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;
