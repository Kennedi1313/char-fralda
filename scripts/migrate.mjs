import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import nextEnv from '@next/env';
import postgres from 'postgres';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error('Configure DATABASE_URL_UNPOOLED antes de migrar.');
const sql = postgres(url, { max: 1, connect_timeout: 15, onnotice() {} });

try {
  await sql.unsafe(await readFile('db/schema.sql', 'utf8'));
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  const files = (await readdir('db/migrations')).filter(name => name.endsWith('.sql')).sort();
  for (const name of files) {
    const source = await readFile(`db/migrations/${name}`, 'utf8');
    const checksum = createHash('sha256').update(source).digest('hex');
    await sql.begin(async tx => {
      await tx`SELECT pg_advisory_xact_lock(513281)`;
      const applied = await tx`SELECT checksum FROM schema_migrations WHERE name = ${name}`;
      if (applied.length) {
        if (applied[0].checksum !== checksum) throw new Error(`Migração já aplicada foi alterada: ${name}`);
        return;
      }
      // A transação é controlada pelo runner, inclusive para scripts SQL manuais.
      const statements = source.replace(/^\s*(BEGIN|COMMIT);\s*$/gim, '');
      await tx.unsafe(statements);
      await tx`INSERT INTO schema_migrations (name, checksum) VALUES (${name}, ${checksum})`;
      console.log(`Aplicada: ${name}`);
    });
  }
  console.log('Banco atualizado.');
} catch (error) {
  console.error('Migração falhou:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
