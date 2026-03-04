import { useState, useCallback } from 'react';
import { sanitizeInput, validateInput } from '@/lib/security';

interface UseSecureInputProps {
  initialValue?: string;
  fieldName: string;
  maxLength?: number;
  required?: boolean;
}

interface UseSecureInputReturn {
  value: string;
  isValid: boolean;
  error: string | null;
  handleChange: (newValue: string) => void;
  handleBlur: () => void;
  sanitizedValue: string;
}

export const useSecureInput = ({ 
  initialValue = '', 
  fieldName, 
  maxLength = 255,
  required = false 
}: UseSecureInputProps): UseSecureInputReturn => {
  const [value, setValue] = useState(sanitizeInput(initialValue, fieldName));
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback((newValue: string) => {
    // Validação de comprimento
    if (newValue.length > maxLength) {
      setError(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
      return;
    }

    // Validação de campo obrigatório (usa trim apenas para validação, não modifica o valor)
    if (required && !newValue.trim()) {
      setError(`${fieldName} é obrigatório`);
    } else {
      setError(null);
    }

    // Validação contra XSS
    const isSecure = validateInput(newValue, fieldName);
    if (!isSecure) {
      setError(`${fieldName} contém conteúdo não permitido. Tags HTML, scripts e código malicioso são bloqueados.`);
      return;
    }

    // Sanitização
    const sanitized = sanitizeInput(newValue, fieldName);
    setValue(sanitized);
  }, [fieldName, maxLength, required]);

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const isValid = !error && (required ? value.trim().length > 0 : true);
  const sanitizedValue = sanitizeInput(value, fieldName);

  return {
    value,
    isValid,
    error: touched ? error : null,
    handleChange,
    handleBlur,
    sanitizedValue
  };
};