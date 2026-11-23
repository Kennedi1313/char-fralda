-- Preserve every participation and message; visibility is now always public.
BEGIN;
ALTER TABLE participations ALTER COLUMN public_message SET DEFAULT true;
UPDATE participations SET public_message = true WHERE public_message = false;
COMMIT;
