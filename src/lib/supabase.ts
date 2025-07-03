import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Please check your .env file.");
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  
  if (error?.message?.includes('JWT')) {
    return "인증 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.";
  }
  
  if (error?.message?.includes('network')) {
    return "네트워크 연결을 확인해주세요.";
  }
  
  if (error?.code === 'PGRST301') {
    return "데이터를 찾을 수 없습니다.";
  }
  
  if (error?.code === '23505') {
    return "이미 존재하는 데이터입니다.";
  }
  
  return error?.message || `${operation} 중 오류가 발생했습니다.`;
};
