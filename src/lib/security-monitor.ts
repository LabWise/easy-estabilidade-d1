// Monitor de segurança para logging e alertas
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private logs: Array<{
    timestamp: Date;
    type: 'warning' | 'error' | 'info';
    message: string;
    data?: any;
  }> = [];

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  logSecurityEvent(type: 'warning' | 'error' | 'info', message: string, data?: any) {
    const event = {
      timestamp: new Date(),
      type,
      message,
      data
    };

    this.logs.push(event);
    
    // Manter apenas os últimos 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Log no console para debug
    if (type === 'error') {
      console.error(`[Security] ${message}`, data);
    } else if (type === 'warning') {
      console.warn(`[Security] ${message}`, data);
    } else {
      console.log(`[Security] ${message}`, data);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  getSecurityStats() {
    const stats = {
      total: this.logs.length,
      warnings: this.logs.filter(log => log.type === 'warning').length,
      errors: this.logs.filter(log => log.type === 'error').length,
      lastHour: this.logs.filter(log => 
        Date.now() - log.timestamp.getTime() < 3600000
      ).length
    };

    return stats;
  }
}

// Instância global do monitor
export const securityMonitor = SecurityMonitor.getInstance();