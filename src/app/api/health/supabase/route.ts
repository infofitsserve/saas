import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("connection_health");
    if (error || data !== true) {
      return Response.json({ connected: false, error: "Supabase connection check failed. Verify project URL, key, and applied migrations." }, { status: 503 });
    }
    return Response.json({ connected: true, service: "supabase" });
  } catch {
    return Response.json({ connected: false, error: "Supabase is not configured. Set project URL and publishable key." }, { status: 503 });
  }
}
