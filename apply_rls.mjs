import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyRLS() {
  const sql = `
-- 1. Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_news ENABLE ROW LEVEL SECURITY;

-- 2. Create Global Admin Policy
DO $$ BEGIN
    CREATE POLICY "Allow public read for news" ON trading_news FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow system to read all users" ON users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow system to read all trades" ON trades FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Community Chat Policies
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read community messages" ON community_messages FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can post" ON community_messages FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;

  console.log("Applying RLS policies...");
  const { data, error } = await supabase.rpc("exec_sql", { sql })
  
  if (error) {
    console.error("Error executing SQL:", error)
  } else {
    console.log("RLS policies successfully applied!", data)
  }
}

applyRLS()
