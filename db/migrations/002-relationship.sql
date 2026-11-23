-- Execute para bancos criados antes do campo de parentesco. Preserva os registros.
ALTER TABLE participations ADD COLUMN IF NOT EXISTS relationship text NOT NULL DEFAULT '';
