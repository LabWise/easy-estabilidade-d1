
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { SecureTextarea } from '@/components/ui/secure-textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useSecureForm } from '@/hooks/useSecureForm';
import { TipoEstabilidadeFormSchema } from '@/lib/security';
import { TipoEstabilidade, PeriodoRetirada, useCreateTipoEstabilidade, useUpdateTipoEstabilidade } from '@/hooks/useConfiguracoes';
import { PeriodosRetirada } from './PeriodosRetirada';

interface FormularioTipoEstabilidadeProps {
  tipo?: TipoEstabilidade;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nome: string;
  sigla: string;
  descricao: string;
  periodos_retirada: PeriodoRetirada[];
  ativo: boolean;
}

export const FormularioTipoEstabilidade: React.FC<FormularioTipoEstabilidadeProps> = ({
  tipo,
  isOpen,
  onClose
}) => {
  const createTipo = useCreateTipoEstabilidade();
  const updateTipo = useUpdateTipoEstabilidade();
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      nome: '',
      sigla: '',
      descricao: '',
      periodos_retirada: [],
      ativo: true,
    }
  });

  const { handleSubmit: secureHandleSubmit } = useSecureForm({
    schema: TipoEstabilidadeFormSchema,
    onSubmit: async (data: FormData) => {
      if (tipo) {
        await updateTipo.mutateAsync({ id: tipo.id, ...data });
      } else {
        await createTipo.mutateAsync(data);
      }
      reset();
      onClose();
    },
    formName: 'FormularioTipoEstabilidade'
  });

  const ativo = watch('ativo');
  const periodosRetirada = watch('periodos_retirada');

  console.log('FormularioTipoEstabilidade - Períodos atuais:', periodosRetirada);

  // Resetar o formulário quando o tipo mudar
  useEffect(() => {
    if (tipo) {
      console.log('Carregando tipo para edição:', tipo);
      console.log('Períodos do tipo:', tipo.periodos_retirada);
      
      reset({
        nome: tipo.nome,
        sigla: tipo.sigla,
        descricao: tipo.descricao || '',
        periodos_retirada: tipo.periodos_retirada || [],
        ativo: tipo.ativo,
      });
    } else {
      console.log('Criando novo tipo');
      reset({
        nome: '',
        sigla: '',
        descricao: '',
        periodos_retirada: [],
        ativo: true,
      });
    }
  }, [tipo, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await secureHandleSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar tipo de estabilidade:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePeriodosChange = (novosPeriodos: PeriodoRetirada[]) => {
    console.log('Períodos alterados:', novosPeriodos);
    setValue('periodos_retirada', novosPeriodos, { shouldDirty: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tipo ? 'Editar Tipo de Estabilidade' : 'Novo Tipo de Estabilidade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sigla">Sigla *</Label>
              <SecureInput
                id="sigla"
                value={watch('sigla')}
                onChange={(value) => setValue('sigla', value.toUpperCase())}
                fieldName="Sigla"
                placeholder="Ex: EST"
                className="uppercase"
                required
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="nome">Nome *</Label>
              <SecureInput
                id="nome"
                value={watch('nome')}
                onChange={(value) => setValue('nome', value)}
                fieldName="Nome do Tipo de Estabilidade"
                placeholder="Nome do tipo de estabilidade"
                required
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <SecureTextarea
              id="descricao"
              value={watch('descricao')}
              onChange={(value) => setValue('descricao', value)}
              fieldName="Descrição"
              placeholder="Descrição detalhada do tipo de estabilidade"
              rows={3}
              maxLength={500}
            />
          </div>

          <PeriodosRetirada
            periodos={periodosRetirada}
            onChange={handlePeriodosChange}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">
              {ativo ? 'Tipo ativo' : 'Tipo inativo'}
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createTipo.isPending || updateTipo.isPending}
            >
              {createTipo.isPending || updateTipo.isPending ? 'Salvando...' : (tipo ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
