CREATE TABLE gift_catalog (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('diaper','gift')),
  name text NOT NULL,
  brands text[] NOT NULL DEFAULT '{}',
  quantity integer NOT NULL CHECK (quantity >= 0),
  active boolean NOT NULL DEFAULT true,
  position bigint GENERATED ALWAYS AS IDENTITY
);
INSERT INTO gift_catalog(id,kind,name,brands,quantity) VALUES
('p','diaper','Fralda P',ARRAY['Pampers','Huggies','MamyPoko'],10),
('m','diaper','Fralda M',ARRAY['Pampers','Huggies','MamyPoko'],25),
('g','diaper','Fralda G',ARRAY['Pampers','Huggies'],20),
('xg','diaper','Fralda XG',ARRAY['Pampers','Huggies'],10),
('lenco','gift','Lenços umedecidos',ARRAY['Marca a combinar'],15),
('pomada','gift','Pomada',ARRAY['A definir pela família'],8),
('body','gift','Body P',ARRAY['Livre escolha'],6),
('livro','gift','Livro infantil',ARRAY['Livre escolha'],5);
CREATE VIEW gift_stock AS
SELECT c.*, COALESCE(r.reserved,0)::integer AS reserved FROM gift_catalog c
LEFT JOIN (
  SELECT id,count(*) AS reserved FROM (
    SELECT diaper AS id FROM participations UNION ALL SELECT gift FROM participations
  ) reservations GROUP BY id
) r ON r.id=c.id;
