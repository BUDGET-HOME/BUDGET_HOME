import { afterEach, describe, expect, it } from "vitest";
import { getOptionalUser } from "./client";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_DB_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_DB_SUPABASE_ANON_KEY",
] as const;

describe("getOptionalUser", () => {
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns null when Supabase is not configured", async () => {
    for (const key of ENV_KEYS) {
      previous.set(key, process.env[key]);
      delete process.env[key];
    }
    await expect(getOptionalUser()).resolves.toBeNull();
  });
});