const PLACEHOLDER_VALUES = new Set([
  "YOUR_PROJECT_REF",
  "YOUR_SUPABASE_PUBLISHABLE_KEY",
  "YOUR_LEGACY_ANON_KEY",
]);

export type SupabaseConfig = { url: string; key: string };

function isServiceRoleKey(key: string) {
  if (key.startsWith("sb_secret_")) return true;
  const segments = key.split(".");
  if (segments.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(segments[1].replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function validateSupabaseConfig(urlValue: string | undefined, keyValue: string | undefined): SupabaseConfig {
  if (!urlValue || !keyValue || PLACEHOLDER_VALUES.has(urlValue) || PLACEHOLDER_VALUES.has(keyValue)) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable key before connecting.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project API URL.");
  }
  if (!(["https:", "http:"].includes(parsedUrl.protocol)) || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("Use the Supabase project API URL, not a dashboard URL or a URL containing a path.");
  }
  if (parsedUrl.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
    throw new Error("Supabase project URLs must use HTTPS.");
  }

  const isPublishable = keyValue.startsWith("sb_publishable_");
  const isLegacyJwt = keyValue.split(".").length === 3;
  if ((!isPublishable && !isLegacyJwt) || isServiceRoleKey(keyValue)) {
    throw new Error("Use a Supabase publishable key or legacy anon key. Service-role/secret keys are not permitted here.");
  }

  return { url: parsedUrl.origin, key: keyValue };
}

export function getSupabaseConfig(): SupabaseConfig {
  return validateSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
