import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bio_id, tipo, link_url, device_info } = body;

    if (!bio_id || !tipo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Gravação direta no banco
    const { error } = await supabaseAdmin.from('bio_analytics').insert([{
      bio_id,
      tipo,
      link_url,
      device_info,
      created_at: new Date().toISOString()
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Analytics Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
