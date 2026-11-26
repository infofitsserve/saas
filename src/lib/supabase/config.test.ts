import { describe, expect, it } from "vitest";
import { validateSupabaseConfig } from "@/lib/supabase/config";

const legacyAnonKey = `header.${btoa(JSON.stringify({ role: "anon" }))}.signature`;
const serviceRoleKey = `header.${btoa(JSON.stringify({ role: "service_role" }))}.signature`;

describe("Supabase configuration", () => {
  it("accepts current publishable keys", () => {
    expect(validateSupabaseConfig("https://project.supabase.co", "sb_publishable_example").key).toBe("sb_publishable_example");
  });

  it("accepts legacy anon JWT keys", () => {
    expect(validateSupabaseConfig("https://project.supabase.co", legacyAnonKey).key).toBe(legacyAnonKey);
  });

  it("rejects dashboard URLs and service-role keys", () => {
    expect(() => validateSupabaseConfig("https://supabase.com/dashboard/project/ref", "sb_publishable_example")).toThrow(/dashboard URL/);
    expect(() => validateSupabaseConfig("https://project.supabase.co", serviceRoleKey)).toThrow(/Service-role/);
    expect(() => validateSupabaseConfig("https://project.supabase.co", "sb_secret_example")).toThrow(/Service-role/);
  });

  it("rejects missing placeholder configuration", () => {
    expect(() => validateSupabaseConfig("https://project.supabase.co", "YOUR_SUPABASE_PUBLISHABLE_KEY")).toThrow(/Configure/);
  });
});
