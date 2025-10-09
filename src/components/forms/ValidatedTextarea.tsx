// src/components/forms/ValidatedTextarea.tsx
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  touched?: boolean;
  showValidationIcon?: boolean;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  maxLength?: number;
  showCharCount?: boolean;
}

const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({
    label,
    error,
    touched,
    showValidationIcon = true,
    helperText,
    variant = 'default',
    size = 'md',
    resize = 'vertical',
    maxLength,
    showCharCount = true,
    className = '',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);

    const hasError = touched && error;
    const hasSuccess = touched && !error && props.value;

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[80px]',
      md: 'px-4 py-3 text-base min-h-[100px]',
      lg: 'px-5 py-4 text-lg min-h-[120px]'
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

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const textareaClasses = `
      w-full rounded-lg transition-all duration-200
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${focusClasses}
      ${resizeClasses[resize]}
      ${hasError ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `.trim();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharCount(value.length);
      props.onChange?.(e);
    };

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

    const getCharCountColor = () => {
      if (!maxLength) return 'text-gray-500 dark:text-gray-400';
      
      const percentage = (charCount / maxLength) * 100;
      if (percentage >= 90) return 'text-red-500';
      if (percentage >= 75) return 'text-yellow-500';
      return 'text-gray-500 dark:text-gray-400';
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
          <textarea
            ref={ref}
            className={textareaClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {showValidationIcon && (
            <div className="absolute top-3 right-3">
              {renderValidationIcon()}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <div>
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {helperText && !hasError && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p className={`text-sm ${getCharCountColor()}`}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

export default ValidatedTextarea;
