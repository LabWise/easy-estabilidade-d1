-- Adicionar chave estrangeira entre amostra_ifas e ifa
ALTER TABLE amostra_ifas 
ADD CONSTRAINT fk_amostra_ifas_ifa 
FOREIGN KEY (ifa_id) REFERENCES ifa(id) ON DELETE CASCADE;