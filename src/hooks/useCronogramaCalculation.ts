
import { FormData, TipoEstabilidade } from '@/types/amostra';

export const useCronogramaCalculation = (formData: FormData, tiposEstabilidade: TipoEstabilidade[]) => {

  const calcularDatasRetirada = () => {
    if (!formData.tipoEstabilidade || !formData.dataEntrada) return [];
    
    // Criar data base usando UTC para evitar problemas de timezone
    const inputDate = new Date(formData.dataEntrada);
    const baseDate = new Date(Date.UTC(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate()
    ));
    const datas = [];
    
    const tipoSelecionado = tiposEstabilidade.find(t => t.id === formData.tipoEstabilidade);
    if (!tipoSelecionado) {
      console.warn('Tipo de estabilidade não encontrado');
      return [];
    }

    console.log('Tipo selecionado:', tipoSelecionado);
    console.log('Períodos de retirada:', tipoSelecionado.periodos_retirada);

    const codigoBase = formData.codigo;
    let versao = 1;

    // Verificar se existem períodos configurados
    if (!tipoSelecionado.periodos_retirada || !Array.isArray(tipoSelecionado.periodos_retirada) || tipoSelecionado.periodos_retirada.length === 0) {
      console.warn(`Tipo de estabilidade ${tipoSelecionado.nome} não possui períodos de retirada configurados`);
      return [];
    }

    console.log(`Processando ${tipoSelecionado.periodos_retirada.length} períodos para tipo ${tipoSelecionado.nome} (${tipoSelecionado.sigla})`);

    // Extrair dados da data base usando UTC
    const anoBase = baseDate.getUTCFullYear();
    const mesBase = baseDate.getUTCMonth(); // 0-based (janeiro = 0)
    const diaOriginal = baseDate.getUTCDate();

    console.log(`Data base UTC: ${diaOriginal}/${mesBase + 1}/${anoBase}`);

    // Gerar datas para amostra principal baseado nos períodos configurados
    tipoSelecionado.periodos_retirada.forEach(({ periodo, dias }, index) => {
      console.log(`Período ${index + 1}: ${periodo} - ${dias} dias`);
      
      if (periodo && dias && dias > 0) {
        let meses: number;
        
        if (periodo.match(/(\d+)M/i)) {
          // Extrair número de meses do período (ex: "3M" -> 3, "6M" -> 6)
          const mesesMatch = periodo.match(/(\d+)M/i);
          meses = mesesMatch ? parseInt(mesesMatch[1]) : Math.round(dias / 30.44);
        } else {
          // Para períodos como "Micro" ou outros que não seguem o padrão "XM"
          // Calcular meses baseado nos dias configurados (dias / 30.44)
          meses = Math.round(dias / 30.44);
        }
        
        console.log(`Usando ${meses} meses para o período ${periodo}`);
        
        // Calcular ano e mês de destino usando os valores UTC já extraídos
        const totalMeses = mesBase + meses;
        const anoDestino = anoBase + Math.floor(totalMeses / 12);
        const mesDestino = totalMeses % 12;
        
        console.log(`Destino calculado UTC: ${diaOriginal}/${mesDestino + 1}/${anoDestino}`);
        
        // Verificar último dia do mês de destino usando UTC
        const ultimoDiaDoMes = new Date(Date.UTC(anoDestino, mesDestino + 1, 0)).getUTCDate();
        
        let dataFinal;
        if (diaOriginal <= ultimoDiaDoMes) {
          // Dia existe no mês de destino - manter o dia original
          dataFinal = new Date(Date.UTC(anoDestino, mesDestino, diaOriginal + 1));
          console.log(`Dia ${diaOriginal} existe no mês ${mesDestino + 1}/${anoDestino} - mantendo`);
        } else {
          // Dia não existe no mês de destino - usar dia 1 do mês seguinte
          const proximoMes = mesDestino + 1;
          const proximoAno = proximoMes > 11 ? anoDestino + 1 : anoDestino;
          const mesAjustado = proximoMes > 11 ? 0 : proximoMes;
          dataFinal = new Date(Date.UTC(proximoAno, mesAjustado, 1));
          console.log(`Dia ${diaOriginal} não existe no mês ${mesDestino + 1}/${anoDestino} - usando 1/${mesAjustado + 1}/${proximoAno}`);
        }
        
        datas.push({
          periodo,
          data: dataFinal,
          codigoVersionado: `${codigoBase}.${versao++}`
        });
        
        console.log(`Adicionada data: ${periodo} em ${dataFinal.toLocaleDateString('pt-BR')} (${dias} dias)`);
      } else {
        console.warn(`Período inválido encontrado:`, { periodo, dias });
      }
    });

    console.log('Datas calculadas:', datas);

    // Se amostra extra está marcada como "true", adicionar uma versão extra
    if (formData.amostraExtra === 'true' && datas.length > 0) {
      const ultimaData = datas[datas.length - 1].data;
      const dataExtra = new Date(ultimaData.getTime()); 

      datas.push({
        periodo: 'Extra',
        data: dataExtra,
        codigoVersionado: `${codigoBase}.${versao}`
      });
      
      console.log('Adicionada versão extra:', dataExtra.toLocaleDateString('pt-BR'));
    }

    console.log(`Total de datas geradas: ${datas.length}`);
    return datas;
  };

  return { calcularDatasRetirada };
};
