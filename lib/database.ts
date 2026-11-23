import postgres from "postgres";

let connection: ReturnType<typeof postgres> | undefined;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  connection ??= postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    prepare: false,
  });
  return connection;
}
