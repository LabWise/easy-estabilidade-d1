export const CHART_COLORS = [
  'hsl(var(--primary))',     // Azul primário
  'hsl(142 76% 36%)',        // Verde
  'hsl(0 84% 60%)',          // Vermelho  
  'hsl(45 85% 55%)',         // Amarelo
  'hsl(280 65% 60%)',        // Roxo
  'hsl(200 70% 45%)',        // Azul claro
  'hsl(20 90% 48%)',         // Laranja
  'hsl(215 16% 47%)',        // Cinza
];

export const getChartColor = (index: number): string => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

// Cores específicas para status comuns
export const STATUS_COLORS = {
  quarentena: 'hsl(45 85% 55%)',      // Amarelo
  analise: 'hsl(200 70% 45%)',        // Azul claro
  pendente: 'hsl(215 16% 47%)',       // Cinza
  aprovado: 'hsl(142 76% 36%)',       // Verde
  reprovado: 'hsl(0 84% 60%)',        // Vermelho
  critico: 'hsl(0 84% 60%)',          // Vermelho
  atencao: 'hsl(20 90% 48%)',         // Laranja
  especial: 'hsl(280 65% 60%)',       // Roxo
};