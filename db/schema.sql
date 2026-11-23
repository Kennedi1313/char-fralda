-- Execute uma vez no SQL Editor do Neon. Não exponha DATABASE_URL ao navegador.
CREATE TABLE IF NOT EXISTS participations (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  relationship text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  public_message boolean NOT NULL DEFAULT true,
  diaper text NOT NULL,
  gift text,
  seat integer UNIQUE CHECK (seat BETWEEN 1 AND 48),
  avatar jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
