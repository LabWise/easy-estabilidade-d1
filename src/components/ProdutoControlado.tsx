import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormData } from '@/types/amostra';
import { useProductControlledData } from '@/hooks/useProductControlledData';

interface ProdutoControladoProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const ProdutoControlado: React.FC<ProdutoControladoProps> = ({
  formData,
  setFormData
}) => {
  const { unidades, produtos, isLoading } = useProductControlledData();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (formData.produtoControlado !== 'true') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de Produto Controlado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="qtdControlado">
              Quantidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="qtdControlado"
              type="number"
              step="0.01"
              placeholder="Ex: 100"
              value={formData.qtdControlado}
              onChange={(e) => handleChange('qtdControlado', e.target.value)}
              required={formData.produtoControlado === 'true'}
            />
          </div>

          <div>
            <Label htmlFor="unidadeControlado">
              Unidade <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.unidadeControlado}
              onValueChange={(value) => handleChange('unidadeControlado', value)}
              required={formData.produtoControlado === 'true'}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a unidade"} />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id.toString()}>
                    {unidade.unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipoControlado">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipoControlado}
              onValueChange={(value) => handleChange('tipoControlado', value)}
              required={formData.produtoControlado === 'true'}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o tipo controlado"} />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};