import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { SecureTextarea } from '@/components/ui/secure-textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSecureForm } from '@/hooks/useSecureForm';
import { TipoAnaliseFormSchema } from '@/lib/security';
import { TipoAnalise, useCreateTipoAnalise, useUpdateTipoAnalise } from '@/hooks/useAnalises';

interface FormularioTipoAnaliseProps {
  isOpen: boolean;
  onClose: () => void;
  tipoAnalise?: TipoAnalise | null;
}

interface FormData {
  descricao: string;
  detalhamento: string;
  ativo: boolean;
}

export const FormularioTipoAnalise: React.FC<FormularioTipoAnaliseProps> = ({
  isOpen,
  onClose,
  tipoAnalise
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      descricao: tipoAnalise?.descricao || '',
      detalhamento: tipoAnalise?.detalhamento || '',
      ativo: tipoAnalise?.ativo ?? true
    }
  });

  const ativo = watch('ativo');
  const createMutation = useCreateTipoAnalise();
  const updateMutation = useUpdateTipoAnalise();

  const { handleSubmit: secureHandleSubmit } = useSecureForm({
    schema: TipoAnaliseFormSchema,
    onSubmit: async (data: FormData) => {
      if (tipoAnalise) {
        updateMutation.mutate({
          id: tipoAnalise.id,
          ...data,
          empresa_id: null
        });
      } else {
        createMutation.mutate({
          ...data,
          empresa_id: null
        });
      }
      onClose();
      reset();
    },
    formName: 'FormularioTipoAnalise'
  });

  React.useEffect(() => {
    if (tipoAnalise) {
      setValue('descricao', tipoAnalise.descricao);
      setValue('detalhamento', tipoAnalise.detalhamento || '');
      setValue('ativo', tipoAnalise.ativo);
    } else {
      reset();
    }
  }, [tipoAnalise, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await secureHandleSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar tipo de análise:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tipoAnalise ? 'Editar Tipo de Análise' : 'Novo Tipo de Análise'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <SecureInput
              id="descricao"
              value={watch('descricao')}
              onChange={(value) => setValue('descricao', value)}
              fieldName="Descrição da Análise"
              placeholder="Nome da análise"
              required
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="detalhamento">Detalhamento</Label>
            <SecureTextarea
              id="detalhamento"
              value={watch('detalhamento')}
              onChange={(value) => setValue('detalhamento', value)}
              fieldName="Detalhamento"
              placeholder="Descrição detalhada da análise"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">Ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};