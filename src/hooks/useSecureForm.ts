import { useCallback } from 'react';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/security';
import { securityMonitor } from '@/lib/security-monitor';

interface UseSecureFormProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => void;
  formName: string;
}

export const useSecureForm = <T>({ schema, onSubmit, formName }: UseSecureFormProps<T>) => {
  const sanitizeFormData = useCallback((data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value, key);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }, []);

  const handleSubmit = useCallback((data: any) => {
    try {
      // Sanitiza os dados primeiro
      const sanitizedData = sanitizeFormData(data);
      
      // Valida com o schema
      const result = schema.safeParse(sanitizedData);
      
      if (!result.success) {
        securityMonitor.logSecurityEvent(
          'warning',
          `Form validation failed for ${formName}`,
          { 
            errors: result.error.errors,
            formData: Object.keys(sanitizedData)
          }
        );
        
        const firstError = result.error.errors[0];
        throw new Error(firstError.message);
      }

      securityMonitor.logSecurityEvent('info', `Form ${formName} submitted successfully`);
      onSubmit(result.data);
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'error',
        `Form ${formName} submission failed`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    }
  }, [schema, onSubmit, formName, sanitizeFormData]);

  return { handleSubmit, sanitizeFormData };
};