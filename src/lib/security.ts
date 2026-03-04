import DOMPurify from 'dompurify';
import { z } from 'zod';
import { securityMonitor } from './security-monitor';

// XSS Protection patterns
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /<meta[\s\S]*?>/gi,
  /<html[\s\S]*?>[\s\S]*?<\/html>/gi,
  /<head[\s\S]*?>[\s\S]*?<\/head>/gi,
  /<body[\s\S]*?>[\s\S]*?<\/body>/gi,
  /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
  /<form[\s\S]*?>[\s\S]*?<\/form>/gi,
  /<input[\s\S]*?>/gi,
  /<textarea[\s\S]*?>[\s\S]*?<\/textarea>/gi,
  /<select[\s\S]*?>[\s\S]*?<\/select>/gi,
  /<button[\s\S]*?>[\s\S]*?<\/button>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<[^>]*\s+on\w+\s*=.*>/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi,
  /behavior\s*:/gi,
  // Adicionais para ataques mais sofisticados
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /Function\s*\(/gi,
  /alert\s*\(/gi,
  /confirm\s*\(/gi,
  /prompt\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /location\./gi,
];

// Safe text validation schema
const createSecureTextSchema = (fieldName: string, maxLength: number = 255) => 
  z.string()
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`)
    .refine(
      (value) => !DANGEROUS_PATTERNS.some(pattern => pattern.test(value)),
      `${fieldName} contém conteúdo não permitido`
    );

// Schema para validação de dados QR Code
export const QRCodeDataSchema = z.object({
  codigo: z.string(),
  produto: z.string().optional(),
  lote: z.string().optional(),
  tempo: z.string().optional(),
  data_entrada: z.string().optional(),
  usuario: z.string().optional(),
  sistema: z.string().optional()
});

export type QRCodeData = z.infer<typeof QRCodeDataSchema>;

/**
 * Sanitiza HTML para prevenir XSS
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

/**
 * Escapa caracteres especiais HTML
 */
export const escapeHTML = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Valida e faz parse seguro de JSON de QR Code
 */
export const parseQRCodeJSON = (jsonString: string): QRCodeData | null => {
  try {
    const parsed = JSON.parse(jsonString);
    const result = QRCodeDataSchema.safeParse(parsed);
    
    if (!result.success) {
      securityMonitor.logSecurityEvent(
        'warning', 
        'QR Code data validation failed', 
        { error: result.error, input: jsonString.substring(0, 100) }
      );
      return null;
    }
    
    securityMonitor.logSecurityEvent('info', 'QR Code parsed successfully');
    return result.data;
  } catch (error) {
    securityMonitor.logSecurityEvent(
      'error', 
      'Failed to parse QR Code JSON', 
      { error, input: jsonString.substring(0, 100) }
    );
    return null;
  }
};

/**
 * Trunca texto com segurança
 */
export const truncateTextSafe = (text: string, maxLength: number): string => {
  const sanitized = sanitizeHTML(text);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength) + '...';
};

/**
 * Valida se uma string é segura para impressão
 */
export const validatePrintData = (data: any): boolean => {
  if (typeof data !== 'string') {
    securityMonitor.logSecurityEvent('warning', 'Non-string data provided for validation', { type: typeof data });
    return false;
  }
  
  const isValid = !DANGEROUS_PATTERNS.some(pattern => pattern.test(data));
  
  if (!isValid) {
    securityMonitor.logSecurityEvent(
      'error', 
      'Dangerous content detected in print data', 
      { input: data.substring(0, 100) }
    );
  }
  
  return isValid;
};

/**
 * Sanitiza input de forma segura e detecta tentativas de XSS
 */
export const sanitizeInput = (input: string, fieldName: string = 'campo'): string => {
  if (typeof input !== 'string') {
    securityMonitor.logSecurityEvent('warning', 'Non-string input provided for sanitization', { type: typeof input, field: fieldName });
    return '';
  }

  // Detecta tentativas de XSS antes da sanitização para auditoria
  const hasXSSAttempt = DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
  if (hasXSSAttempt) {
    securityMonitor.logSecurityEvent(
      'error',
      'XSS attempt detected',
      { 
        field: fieldName,
        input: input.substring(0, 200),
        timestamp: new Date().toISOString()
      }
    );
  }

  // Sanitiza o conteúdo
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  // Remove apenas caracteres de controle perigosos, preserva espaços normais
  const cleaned = sanitized
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove caracteres de controle

  return cleaned;
};

/**
 * Valida input contra XSS em tempo real
 */
export const validateInput = (input: string, fieldName: string = 'campo'): boolean => {
  if (typeof input !== 'string') return false;
  
  const hasXSS = DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
  if (hasXSS) {
    securityMonitor.logSecurityEvent(
      'warning',
      'Input validation failed - potential XSS',
      { field: fieldName, input: input.substring(0, 100) }
    );
  }
  
  return !hasXSS;
};

// Form Validation Schemas
export const AmostraFormSchema = z.object({
  nomeProduto: createSecureTextSchema('Nome do Produto', 200),
  lote: createSecureTextSchema('Lote', 100),
  fabricante: createSecureTextSchema('Fabricante', 200).optional(),
  cliente: createSecureTextSchema('Cliente', 200).optional(),
  numeroPedido: createSecureTextSchema('Número do Pedido', 100).optional(),
  noProjeto: createSecureTextSchema('Número do Projeto', 100).optional(),
  tamanhoLote: createSecureTextSchema('Tamanho do Lote', 100).optional(),
  concentracaoProduto: createSecureTextSchema('Concentração', 100).optional(),
  materialAcondicionamento: createSecureTextSchema('Material de Acondicionamento', 200).optional(),
  metodologiaRevisao: createSecureTextSchema('Metodologia/Revisão', 200).optional(),
  enderecoFabricante: createSecureTextSchema('Endereço do Fabricante', 500).optional(),
  observacoes: createSecureTextSchema('Observações', 1000).optional(),
});

export const ProdutoFormSchema = z.object({
  nome: createSecureTextSchema('Nome', 200),
  codigo: createSecureTextSchema('Código', 50),
  principio_ativo: createSecureTextSchema('Princípio Ativo', 200).optional(),
  concentracao: createSecureTextSchema('Concentração', 100).optional(),
  forma_farmaceutica: createSecureTextSchema('Forma Farmacêutica', 100).optional(),
  fabricante: createSecureTextSchema('Fabricante', 200).optional(),
});

export const EquipamentoFormSchema = z.object({
  nome: createSecureTextSchema('Nome', 200),
  codigo: createSecureTextSchema('Código', 50),
  tipo: createSecureTextSchema('Tipo', 100),
  localizacao: createSecureTextSchema('Localização', 200).optional(),
});

export const UsuarioFormSchema = z.object({
  nome: createSecureTextSchema('Nome', 200),
  email: z.string().email('Email inválido').max(200, 'Email deve ter no máximo 200 caracteres'),
  profile_type: z.enum(['administrador', 'gestor', 'analista_de_estabilidade', 'analista_de_laboratorio']),
});

export const TipoEstabilidadeFormSchema = z.object({
  nome: createSecureTextSchema('Nome', 100),
  sigla: createSecureTextSchema('Sigla', 10),
  descricao: createSecureTextSchema('Descrição', 500).optional(),
  periodos_retirada: z.array(z.any()),
  ativo: z.boolean(),
});

export const TipoAnaliseFormSchema = z.object({
  descricao: createSecureTextSchema('Descrição', 100),
  detalhamento: createSecureTextSchema('Detalhamento', 500).optional(),
  ativo: z.boolean(),
});

// Schema para Status de Retirada
export const StatusRetiradaFormSchema = z.object({
  descricao: createSecureTextSchema('Descrição', 100),
  ativo: z.boolean(),
});

// Schema para Períodos de Retirada
export const PeriodoRetiradaSchema = z.object({
  periodo: createSecureTextSchema('Período', 20),
  dias: z.number().min(1).max(9999),
});

// Schema para edição de usuário (usando UsuarioFormSchema já existente)
export const EditarUsuarioFormSchema = z.object({
  nome: createSecureTextSchema('Nome', 100),
  email: z.string().email('Email inválido').max(255),
  profile_type: z.enum(['administrador', 'gestor', 'analista_de_estabilidade', 'analista_de_laboratorio']),
});

// Schema para validação de IFA
export const IFAFormSchema = z.object({
  ifa: createSecureTextSchema('IFA', 200),
  fabricante: createSecureTextSchema('Fabricante', 200),
  dcb: createSecureTextSchema('DCB', 100).optional().or(z.literal('')),
  lote: createSecureTextSchema('Lote', 100).optional().or(z.literal('')),
  endereco_fabricante: createSecureTextSchema('Endereço do Fabricante', 500).optional().or(z.literal('')),
  numero_cas: createSecureTextSchema('Número CAS', 50).optional().or(z.literal('')),
});

/**
 * Cria conteúdo HTML seguro para impressão
 */
export const createSecurePrintContent = (
  template: string, 
  data: Record<string, any>, 
  safeHtmlFields: string[] = []
): string => {
  let content = template;
  
  // Substitui placeholders de forma segura
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    // Se o campo está na lista de HTML seguro, não escapa o HTML
    const safeValue = safeHtmlFields.includes(key) 
      ? String(value || '') 
      : escapeHTML(String(value || ''));
    content = content.replace(new RegExp(placeholder, 'g'), safeValue);
  });
  
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'strong', 'em', 'br', 'img'],
    ALLOWED_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
};