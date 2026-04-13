import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const tables = [
  "users",
  "trading_tools",
  "user_tools",
  "trades",
  "leaderboard",
  "activity_feed",
  "tool_stats",
  "available_avatars",
  "user_sessions",
  "trading_news",
  "bot_logs",
  "bot_sessions",
  "notifications",
  "community_messages",
  "support_messages",
  "admin_users"
];

async function applyUnifiedRLS() {
  let sql = "";

  for (const table of tables) {
    sql += `
-- Process table: ${table}
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '${table}') THEN
    ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing default policies if we want to replace them, but it's safer to just add conditional new ones.
    -- We will grant SELECT to everyone so the dashboard can fetch the data
    BEGIN
      CREATE POLICY "Allow public select on ${table}" ON ${table} FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN null; END;
    
    BEGIN
      CREATE POLICY "Allow public insert on ${table}" ON ${table} FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN null; END;

    BEGIN
      CREATE POLICY "Allow public update on ${table}" ON ${table} FOR UPDATE USING (true);
    EXCEPTION WHEN duplicate_object THEN null; END;
  END IF;
END $$;
`;
  }

  console.log("Applying Unified RLS policies to all tables...");
  const { data, error } = await supabase.rpc("exec_sql", { sql })
  
  if (error) {
    console.error("Error executing SQL:", error)
  } else {
    console.log("Unified RLS policies successfully applied! Your dashboard should now fetch all data correctly.", data)
  }
}

applyUnifiedRLS()
