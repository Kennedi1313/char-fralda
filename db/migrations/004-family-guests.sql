ALTER TABLE participations ALTER COLUMN diaper DROP NOT NULL;
ALTER TABLE participations ADD COLUMN sponsor_id uuid REFERENCES participations(id) ON DELETE SET NULL;
