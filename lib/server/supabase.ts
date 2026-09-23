import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트. secret key 를 쓰므로 RLS 를 우회한다. 절대 브라우저 코드에서 import 하지 않는다.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);
