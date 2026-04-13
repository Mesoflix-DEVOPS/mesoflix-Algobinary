import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function alterSchema() {
  const sql = `
    -- Create support_messages table if it does not exist
    CREATE TABLE IF NOT EXISTS support_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add sender col if missing
    DO $$ 
    BEGIN
      ALTER TABLE support_messages ADD COLUMN sender TEXT DEFAULT 'user';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;

    -- Update permissions
    ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
    
    DO $$ BEGIN
      CREATE POLICY "Allow public read support messages" ON support_messages FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE POLICY "Allow authenticated to insert support messages" ON support_messages FOR INSERT WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Finally force postgrest to reload schema cache
    NOTIFY pgrst, 'reload schema';
  `

  console.log("Updating support_messages schema and reloading cache...")
  const { data, error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("Error updating schema:", error)
    // If exec_sql doesn't work, we'll see the error
  } else {
    console.log("Schema cache reloaded successfully!")
  }
}

alterSchema()
