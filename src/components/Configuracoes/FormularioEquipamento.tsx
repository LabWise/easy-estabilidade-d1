import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { Equipamento, useCreateEquipamento, useUpdateEquipamento } from '@/hooks/useConfiguracoes';
import { useSecureForm } from '@/hooks/useSecureForm';
import { EquipamentoFormSchema } from '@/lib/security';
import { toast } from '@/hooks/use-toast';

interface FormularioEquipamentoProps {
  equipamento?: Equipamento;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nome: string;
  codigo: string;
  tipo: string;
  localizacao: string;
  temperatura_min: number | '';
  temperatura_max: number | '';
  umidade_min: number | '';
  umidade_max: number | '';
  capacidade: number | '';
  ativo: boolean;
}

export const FormularioEquipamento: React.FC<FormularioEquipamentoProps> = ({
  equipamento,
  isOpen,
  onClose
}) => {
  const createEquipamento = useCreateEquipamento();
  const updateEquipamento = useUpdateEquipamento();
  
  const { handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      nome: equipamento?.nome || '',
      codigo: equipamento?.codigo || '',
      tipo: equipamento?.tipo || '',
      localizacao: equipamento?.localizacao || '',
      temperatura_min: equipamento?.temperatura_min || '',
      temperatura_max: equipamento?.temperatura_max || '',
      umidade_min: equipamento?.umidade_min || '',
      umidade_max: equipamento?.umidade_max || '',
      capacidade: equipamento?.capacidade || '',
      ativo: equipamento?.ativo ?? true,
    }
  });

  const formData = watch();

  const { handleSubmit: handleSecureSubmit } = useSecureForm({
    schema: EquipamentoFormSchema,
    onSubmit: async (data: FormData) => {
      try {
        const formattedData = {
          ...data,
          temperatura_min: data.temperatura_min === '' ? null : Number(data.temperatura_min),
          temperatura_max: data.temperatura_max === '' ? null : Number(data.temperatura_max),
          umidade_min: data.umidade_min === '' ? null : Number(data.umidade_min),
          umidade_max: data.umidade_max === '' ? null : Number(data.umidade_max),
          capacidade: data.capacidade === '' ? null : Number(data.capacidade),
        };

        if (equipamento) {
          await updateEquipamento.mutateAsync({
            id: equipamento.id,
            ...formattedData
          });
        } else {
          await createEquipamento.mutateAsync(formattedData);
        }
        reset();
        onClose();
      } catch (error) {
        console.error('Erro ao salvar equipamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar equipamento. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }
    },
    formName: 'FormularioEquipamento'
  });

  const onSubmit = handleSubmit(handleSecureSubmit);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {equipamento ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <SecureInput
                value={formData.codigo}
                onChange={(value) => setValue('codigo', value)}
                fieldName="Código"
                placeholder="Ex: EQ001"
                required
              />
            </div>

            <div>
              <Label htmlFor="nome">Nome *</Label>
              <SecureInput
                value={formData.nome}
                onChange={(value) => setValue('nome', value)}
                fieldName="Nome"
                placeholder="Nome do equipamento"
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <SecureInput
                value={formData.tipo}
                onChange={(value) => setValue('tipo', value)}
                fieldName="Tipo"
                placeholder="Ex: Câmara de Estabilidade"
                required
              />
            </div>

            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <SecureInput
                value={formData.localizacao}
                onChange={(value) => setValue('localizacao', value)}
                fieldName="Localização"
                placeholder="Localização do equipamento"
              />
            </div>

            <div>
              <Label htmlFor="temperatura_min">Temperatura Mínima (°C)</Label>
              <SecureInput
                value={formData.temperatura_min?.toString() || ''}
                onChange={(value) => setValue('temperatura_min', value === '' ? '' : Number(value))}
                fieldName="Temperatura Mínima"
                type="number"
                step="0.1"
                placeholder="Ex: 25"
              />
            </div>

            <div>
              <Label htmlFor="temperatura_max">Temperatura Máxima (°C)</Label>
              <SecureInput
                value={formData.temperatura_max?.toString() || ''}
                onChange={(value) => setValue('temperatura_max', value === '' ? '' : Number(value))}
                fieldName="Temperatura Máxima"
                type="number"
                step="0.1"
                placeholder="Ex: 40"
              />
            </div>

            <div>
              <Label htmlFor="umidade_min">Umidade Mínima (%)</Label>
              <SecureInput
                value={formData.umidade_min?.toString() || ''}
                onChange={(value) => setValue('umidade_min', value === '' ? '' : Number(value))}
                fieldName="Umidade Mínima"
                type="number"
                step="0.1"
                placeholder="Ex: 60"
              />
            </div>

            <div>
              <Label htmlFor="umidade_max">Umidade Máxima (%)</Label>
              <SecureInput
                value={formData.umidade_max?.toString() || ''}
                onChange={(value) => setValue('umidade_max', value === '' ? '' : Number(value))}
                fieldName="Umidade Máxima"
                type="number"
                step="0.1"
                placeholder="Ex: 75"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="capacidade">Capacidade</Label>
              <SecureInput
                value={formData.capacidade?.toString() || ''}
                onChange={(value) => setValue('capacidade', value === '' ? '' : Number(value))}
                fieldName="Capacidade"
                type="number"
                placeholder="Capacidade do equipamento"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">
              {formData.ativo ? 'Equipamento ativo' : 'Equipamento inativo'}
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createEquipamento.isPending || updateEquipamento.isPending}
            >
              {equipamento ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};