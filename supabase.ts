import { createClient } from "@supabase/supabase-js";

// ✅ 환경 변수가 없을 경우 오류 방지 (강제 변환)
const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// ✅ 환경 변수가 없을 경우 오류 출력
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
