import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSecureInput } from '@/hooks/useSecureInput';
import { cn } from '@/lib/utils';

interface SecureTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  fieldName: string;
  maxLength?: number;
  required?: boolean;
  showError?: boolean;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  value,
  onChange,
  fieldName,
  maxLength = 1000,
  required = false,
  showError = true,
  className,
  ...props
}) => {
  const {
    value: secureValue,
    isValid,
    error,
    handleChange,
    handleBlur
  } = useSecureInput({
    initialValue: value,
    fieldName,
    maxLength,
    required
  });

  React.useEffect(() => {
    if (secureValue !== value) {
      onChange(secureValue);
    }
  }, [secureValue, onChange, value]);

  React.useEffect(() => {
    const handleFormReset = () => {
      handleChange('');
    };

    window.addEventListener('formReset', handleFormReset);
    return () => window.removeEventListener('formReset', handleFormReset);
  }, [handleChange]);

  return (
    <div className="space-y-1">
      <Textarea
        {...props}
        value={secureValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={cn(
          className,
          !isValid && showError && error && "border-red-500 focus-visible:ring-red-500"
        )}
      />
      {error && showError && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
};