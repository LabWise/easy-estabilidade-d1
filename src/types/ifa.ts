export interface IFA {
  id: number;
  ifa: string;
  fabricante: string;
  dcb: string;
  lote: string;
  data_fabricacao: Date | null;
  data_validade: Date | null;
  endereco_fabricante: string;
  numero_cas: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface AmostraIFA {
  id: string;
  amostra_id: string;
  ifa_id: number;
  created_at: string;
  updated_at: string;
  empresa_id: number;
}

export interface IFAFormData {
  ifa: string;
  fabricante: string;
  dcb: string;
  lote: string;
  data_fabricacao: Date | null;
  data_validade: Date | null;
  endereco_fabricante: string;
  numero_cas: string;
}