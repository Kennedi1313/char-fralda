ALTER TABLE participations ADD COLUMN google_owner uuid UNIQUE;
ALTER TABLE participations ADD COLUMN guest_edit_until timestamptz;
CREATE TABLE garden_sessions (
  token_hash text PRIMARY KEY,
  owner_id uuid NOT NULL,
  display_name text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX garden_sessions_expiry ON garden_sessions(expires_at);
