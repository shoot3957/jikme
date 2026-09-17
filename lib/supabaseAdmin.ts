import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 이 파일은 service_role 키를 다루는 서버 전용 모듈 — 클라이언트 번들에 절대 포함되면 안 된다.
if (typeof window !== 'undefined') {
  throw new Error('lib/supabaseAdmin.ts는 서버 전용입니다. 클라이언트 컴포넌트에서 import하지 마세요.');
}

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin?: SupabaseClient;
};

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다.');
  }

  // service_role 키는 RLS를 우회하는 관리자 권한 키 — 서버 코드에서만 사용하고
  // 절대 클라이언트로 전달하거나 응답에 포함하지 않는다.
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const supabaseAdmin: SupabaseClient = globalForSupabase.supabaseAdmin ?? createSupabaseAdmin();

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabaseAdmin = supabaseAdmin;
