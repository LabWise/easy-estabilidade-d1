
import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabelaProdutos } from '@/components/Configuracoes/TabelaProdutos';
import { TabelaEquipamentos } from '@/components/Configuracoes/TabelaEquipamentos';
import { TabelaTiposEstabilidade } from '@/components/Configuracoes/TabelaTiposEstabilidade';
import { TabelaStatusRetirada } from '@/components/Configuracoes/TabelaStatusRetirada';
import { TabelaTiposAnalise } from '@/components/Configuracoes/TabelaTiposAnalise';
import { TabelaUsuarios } from '@/components/Configuracoes/TabelaUsuarios';
import { useUserProfile } from '@/hooks/useUserProfile';

const Configuracoes = () => {
  const { isAdmin } = useUserProfile();

  return (
    <ResponsiveLayout title="Configurações">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-1">
          <Tabs defaultValue="produtos" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
              <TabsTrigger value="tipos">Tipos de Estabilidade</TabsTrigger>
              <TabsTrigger value="status">Status de Retirada</TabsTrigger>
              <TabsTrigger value="analises">Cadastro de Análise</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="usuarios">Usuários</TabsTrigger>
              )}
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="produtos" className="space-y-6">
                <TabelaProdutos />
              </TabsContent>
              
              <TabsContent value="equipamentos" className="space-y-6">
                <TabelaEquipamentos />
              </TabsContent>
              
              <TabsContent value="tipos" className="space-y-6">
                <TabelaTiposEstabilidade />
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <TabelaStatusRetirada />
              </TabsContent>

              <TabsContent value="analises" className="space-y-6">
                <TabelaTiposAnalise />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="usuarios" className="space-y-6">
                  <TabelaUsuarios />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Configuracoes;
