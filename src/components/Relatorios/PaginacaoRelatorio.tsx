import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginacaoRelatorioProps {
  paginaAtual: number;
  totalPaginas: number;
  setPaginaAtual: (pagina: number) => void;
  totalRegistros: number;
  itensPorPagina: number;
}

export const PaginacaoRelatorio: React.FC<PaginacaoRelatorioProps> = ({
  paginaAtual,
  totalPaginas,
  setPaginaAtual,
  totalRegistros,
  itensPorPagina
}) => {
  if (totalPaginas <= 1) return null;

  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalRegistros);

  // Gerar páginas para mostrar
  const gerarPaginas = () => {
    const paginas: (number | 'ellipsis')[] = [];
    
    if (totalPaginas <= 7) {
      // Se há 7 ou menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Sempre mostrar primeira página
      paginas.push(1);
      
      if (paginaAtual <= 4) {
        // Início: 1, 2, 3, 4, 5, ..., último
        for (let i = 2; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push('ellipsis');
        paginas.push(totalPaginas);
      } else if (paginaAtual >= totalPaginas - 3) {
        // Final: 1, ..., último-4, último-3, último-2, último-1, último
        paginas.push('ellipsis');
        for (let i = totalPaginas - 4; i <= totalPaginas; i++) {
          paginas.push(i);
        }
      } else {
        // Meio: 1, ..., atual-1, atual, atual+1, ..., último
        paginas.push('ellipsis');
        for (let i = paginaAtual - 1; i <= paginaAtual + 1; i++) {
          paginas.push(i);
        }
        paginas.push('ellipsis');
        paginas.push(totalPaginas);
      }
    }
    
    return paginas;
  };

  const paginas = gerarPaginas();

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {inicio} a {fim} de {totalRegistros} registros
      </p>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1);
              }}
              className={paginaAtual <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {paginas.map((pagina, index) => (
            <PaginationItem key={index}>
              {pagina === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPaginaAtual(pagina);
                  }}
                  isActive={pagina === paginaAtual}
                  className="cursor-pointer"
                >
                  {pagina}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1);
              }}
              className={paginaAtual >= totalPaginas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};