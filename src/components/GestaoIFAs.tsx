import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { IFALocal } from '@/types/amostra';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IFAFormSchema } from '@/lib/security';
import { securityMonitor } from '@/lib/security-monitor';
import { toast } from '@/hooks/use-toast';

interface GestaoIFAsProps {
  ifasLocais: IFALocal[];
  onIFAsChange: (ifas: IFALocal[]) => void;
  modoEdicao?: 'criacao' | 'edicao';
}

const GestaoIFAs: React.FC<GestaoIFAsProps> = ({ ifasLocais, onIFAsChange, modoEdicao = 'criacao' }) => {
  // Inicializar com o primeiro IFA aberto se existir
  const [ifasAbertos, setIFAsAbertos] = useState<Set<string>>(() => {
    return ifasLocais.length > 0 ? new Set([ifasLocais[0].id]) : new Set();
  });

  // Atualizar ifasAbertos quando novos IFAs chegarem
  useEffect(() => {
    console.log('GestaoIFAs useEffect executado com ifasLocais:', ifasLocais);
    if (ifasLocais && ifasLocais.length > 0) {
      setIFAsAbertos(prev => {
        const novoSet = new Set(prev);
        // Abrir automaticamente o primeiro IFA se nenhum estiver aberto
        if (novoSet.size === 0) {
          novoSet.add(ifasLocais[0].id);
        }
        return novoSet;
      });
    }
  }, [ifasLocais]);

  const toggleIFAAberto = (ifaId: string) => {
    const novosAbertos = new Set(ifasAbertos);
    if (novosAbertos.has(ifaId)) {
      novosAbertos.delete(ifaId);
    } else {
      novosAbertos.add(ifaId);
    }
    setIFAsAbertos(novosAbertos);
  };

  const adicionarNovoIFA = () => {
    if (ifasLocais.length >= 10) return;

    const novoIFA: IFALocal = {
      id: `temp-${Date.now()}-${Math.random()}`,
      ifa: '',
      fabricante: '',
      dcb: '',
      lote: '',
      data_fabricacao: null,
      data_validade: null,
      endereco_fabricante: '',
      numero_cas: '',
    };

    const novosIFAs = [...ifasLocais, novoIFA];
    onIFAsChange(novosIFAs);
    
    // Abrir automaticamente o novo IFA
    setIFAsAbertos(prev => new Set([...prev, novoIFA.id]));
  };

  const removerIFA = (ifaId: string) => {
    const novosIFAs = ifasLocais.filter(ifa => ifa.id !== ifaId);
    onIFAsChange(novosIFAs);
    
    // Remover do conjunto de abertos
    const novosAbertos = new Set(ifasAbertos);
    novosAbertos.delete(ifaId);
    setIFAsAbertos(novosAbertos);
  };

  const atualizarIFA = (ifaId: string, campo: string, valor: any) => {
    // Validação de segurança para campos de texto
    if (typeof valor === 'string' && campo !== 'data_fabricacao' && campo !== 'data_validade') {
      const testData = { [campo]: valor };
      const result = IFAFormSchema.partial().safeParse(testData);
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        securityMonitor.logSecurityEvent(
          'warning',
          `IFA field validation failed: ${campo}`,
          { field: campo, error: firstError.message }
        );
        
        toast({
          title: "Entrada inválida",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
    }

    const novosIFAs = ifasLocais.map(ifa => 
      ifa.id === ifaId ? { ...ifa, [campo]: valor } : ifa
    );
    onIFAsChange(novosIFAs);
  };

  const podeAdicionarIFA = ifasLocais.length < 10;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Dados IFA
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              IFAs cadastrados: {ifasLocais.length}{modoEdicao === 'criacao' ? '/10' : ''}
            </span>
            {modoEdicao === 'criacao' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarNovoIFA}
                disabled={!podeAdicionarIFA}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo IFA
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {ifasLocais.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {modoEdicao === 'edicao' 
              ? 'Nenhum IFA associado a esta amostra.' 
              : 'Nenhum IFA cadastrado. Clique em "Novo IFA" para adicionar.'
            }
          </p>
        ) : (
          <div className="space-y-3">
            {ifasLocais.map((ifa, index) => {
              const estaAberto = ifasAbertos.has(ifa.id);
              const titulo = ifa.ifa || `IFA ${index + 1}`;
              
              return (
                <Card key={ifa.id} className="border-l-4 border-l-primary/20">
                  <Collapsible open={estaAberto} onOpenChange={() => toggleIFAAberto(ifa.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {estaAberto ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <h4 className="font-medium">{titulo}</h4>
                            </div>
                            {ifa.fabricante && (
                              <span className="text-sm text-muted-foreground">
                                - {ifa.fabricante}
                              </span>
                            )}
                          </div>
                          {modoEdicao === 'criacao' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removerIFA(ifa.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* IFA */}
                          <div className="space-y-2">
                            <Label htmlFor={`ifa-${ifa.id}`}>Insumo Farmacêutico Ativo (IFA) *</Label>
                            <SecureInput
                              id={`ifa-${ifa.id}`}
                              value={ifa.ifa}
                              onChange={(value) => atualizarIFA(ifa.id, 'ifa', value)}
                              fieldName="IFA"
                              maxLength={200}
                              required={true}
                              placeholder="Digite o nome do IFA"
                            />
                          </div>

                          {/* Fabricante IFA */}
                          <div className="space-y-2">
                            <Label htmlFor={`fabricante-${ifa.id}`}>Fabricante do IFA *</Label>
                            <SecureInput
                              id={`fabricante-${ifa.id}`}
                              value={ifa.fabricante}
                              onChange={(value) => atualizarIFA(ifa.id, 'fabricante', value)}
                              fieldName="Fabricante"
                              maxLength={200}
                              required={true}
                              placeholder="Digite o fabricante do IFA"
                            />
                          </div>

                          {/* DCB IFA */}
                          <div className="space-y-2">
                            <Label htmlFor={`dcb-${ifa.id}`}>DCB do IFA</Label>
                            <SecureInput
                              id={`dcb-${ifa.id}`}
                              value={ifa.dcb}
                              onChange={(value) => atualizarIFA(ifa.id, 'dcb', value)}
                              fieldName="DCB"
                              maxLength={100}
                              placeholder="Digite o DCB do IFA"
                            />
                          </div>

                          {/* Lote IFA */}
                          <div className="space-y-2">
                            <Label htmlFor={`lote-${ifa.id}`}>Lote IFA</Label>
                            <SecureInput
                              id={`lote-${ifa.id}`}
                              value={ifa.lote}
                              onChange={(value) => atualizarIFA(ifa.id, 'lote', value)}
                              fieldName="Lote"
                              maxLength={100}
                              placeholder="Digite o lote do IFA"
                            />
                          </div>

                          {/* Data Fabricação */}
                          <div className="space-y-2">
                            <Label>Data Fabricação do IFA</Label>
                            <DatePicker
                              date={ifa.data_fabricacao}
                              onDateChange={(date) => atualizarIFA(ifa.id, 'data_fabricacao', date)}
                              placeholder="Selecione a data de fabricação"
                            />
                          </div>

                          {/* Data Validade */}
                          <div className="space-y-2">
                            <Label>Data Validade do IFA</Label>
                            <DatePicker
                              date={ifa.data_validade}
                              onDateChange={(date) => atualizarIFA(ifa.id, 'data_validade', date)}
                              placeholder="Selecione a data de validade"
                            />
                          </div>

                          {/* Nº CAS */}
                          <div className="space-y-2">
                            <Label htmlFor={`numero_cas-${ifa.id}`}>Nº CAS</Label>
                            <SecureInput
                              id={`numero_cas-${ifa.id}`}
                              value={ifa.numero_cas}
                              onChange={(value) => atualizarIFA(ifa.id, 'numero_cas', value)}
                              fieldName="Número CAS"
                              maxLength={50}
                              placeholder="Digite o número CAS"
                            />
                          </div>

                          {/* Endereço Fabricante */}
                          <div className="space-y-2">
                            <Label htmlFor={`endereco_fabricante-${ifa.id}`}>Endereço do Fabricante</Label>
                            <SecureInput
                              id={`endereco_fabricante-${ifa.id}`}
                              value={ifa.endereco_fabricante}
                              onChange={(value) => atualizarIFA(ifa.id, 'endereco_fabricante', value)}
                              fieldName="Endereço do Fabricante"
                              maxLength={500}
                              placeholder="Digite o endereço do fabricante"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GestaoIFAs;