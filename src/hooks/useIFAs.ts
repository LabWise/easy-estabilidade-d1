import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ifaService } from '@/services/ifaService';
import { IFAFormData } from '@/types/ifa';
import { toast } from '@/hooks/use-toast';

export const useIFAs = () => {
  const queryClient = useQueryClient();

  // Query para buscar IFAs
  const ifasQuery = useQuery({
    queryKey: ['ifas'],
    queryFn: () => ifaService.buscarIFAs(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar IFA
  const criarIFAMutation = useMutation({
    mutationFn: (dadosIFA: IFAFormData) => ifaService.criarIFA(dadosIFA),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifas'] });
      toast({
        title: "Sucesso",
        description: "IFA criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar IFA:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar IFA. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar IFA
  const atualizarIFAMutation = useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: IFAFormData }) => 
      ifaService.atualizarIFA(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifas'] });
      toast({
        title: "Sucesso",
        description: "IFA atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar IFA:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar IFA. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar IFA
  const deletarIFAMutation = useMutation({
    mutationFn: (id: number) => ifaService.deletarIFA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifas'] });
      toast({
        title: "Sucesso",
        description: "IFA deletado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar IFA:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar IFA. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    ifas: ifasQuery.data || [],
    isLoading: ifasQuery.isLoading,
    error: ifasQuery.error,
    criarIFA: criarIFAMutation.mutate,
    atualizarIFA: atualizarIFAMutation.mutate,
    deletarIFA: deletarIFAMutation.mutate,
    isCreating: criarIFAMutation.isPending,
    isUpdating: atualizarIFAMutation.isPending,
    isDeleting: deletarIFAMutation.isPending,
  };
};