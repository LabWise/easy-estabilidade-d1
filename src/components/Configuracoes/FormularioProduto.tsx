import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { Produto, useCreateProduto, useUpdateProduto } from '@/hooks/useConfiguracoes';
import { useSecureForm } from '@/hooks/useSecureForm';
import { ProdutoFormSchema } from '@/lib/security';
import { toast } from '@/hooks/use-toast';

interface FormularioProdutoProps {
  produto?: Produto;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nome: string;
  codigo: string;
  principio_ativo: string;
  concentracao: string;
  forma_farmaceutica: string;
  fabricante: string;
  ativo: boolean;
}

export const FormularioProduto: React.FC<FormularioProdutoProps> = ({
  produto,
  isOpen,
  onClose
}) => {
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  
  const { handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      nome: produto?.nome || '',
      codigo: produto?.codigo || '',
      principio_ativo: produto?.principio_ativo || '',
      concentracao: produto?.concentracao || '',
      forma_farmaceutica: produto?.forma_farmaceutica || '',
      fabricante: produto?.fabricante || '',
      ativo: produto?.ativo ?? true,
    }
  });

  const formData = watch();

  const { handleSubmit: handleSecureSubmit } = useSecureForm({
    schema: ProdutoFormSchema,
    onSubmit: async (data: FormData) => {
      try {
        if (produto) {
          await updateProduto.mutateAsync({
            id: produto.id,
            ...data
          });
        } else {
          await createProduto.mutateAsync(data);
        }
        reset();
        onClose();
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar produto. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }
    },
    formName: 'FormularioProduto'
  });

  const onSubmit = handleSubmit(handleSecureSubmit);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {produto ? 'Editar Produto' : 'Novo Produto'}
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
                placeholder="Ex: PROD001"
                required
              />
            </div>

            <div>
              <Label htmlFor="nome">Nome *</Label>
              <SecureInput
                value={formData.nome}
                onChange={(value) => setValue('nome', value)}
                fieldName="Nome"
                placeholder="Nome do produto"
                required
              />
            </div>

            <div>
              <Label htmlFor="principio_ativo">Princípio Ativo</Label>
              <SecureInput
                value={formData.principio_ativo}
                onChange={(value) => setValue('principio_ativo', value)}
                fieldName="Princípio Ativo"
                placeholder="Princípio ativo"
              />
            </div>

            <div>
              <Label htmlFor="concentracao">Concentração</Label>
              <SecureInput
                value={formData.concentracao}
                onChange={(value) => setValue('concentracao', value)}
                fieldName="Concentração"
                placeholder="Ex: 500mg"
              />
            </div>

            <div>
              <Label htmlFor="forma_farmaceutica">Forma Farmacêutica</Label>
              <SecureInput
                value={formData.forma_farmaceutica}
                onChange={(value) => setValue('forma_farmaceutica', value)}
                fieldName="Forma Farmacêutica"
                placeholder="Ex: Comprimido"
              />
            </div>

            <div>
              <Label htmlFor="fabricante">Fabricante</Label>
              <SecureInput
                value={formData.fabricante}
                onChange={(value) => setValue('fabricante', value)}
                fieldName="Fabricante"
                placeholder="Nome do fabricante"
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
              {formData.ativo ? 'Produto ativo' : 'Produto inativo'}
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createProduto.isPending || updateProduto.isPending}
            >
              {produto ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};