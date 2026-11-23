import { createHash, timingSafeEqual } from "node:crypto";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function isFamily(request: Request) {
  const password = process.env.FAMILY_PASSWORD;
  const candidate =
    request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return (
    !!password &&
    timingSafeEqual(Buffer.from(hash(password)), Buffer.from(hash(candidate)))
  );
}
