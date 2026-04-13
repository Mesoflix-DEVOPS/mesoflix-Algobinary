import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function enableRealtime() {
  // Enable Supabase Realtime on key tables by adding them to the replication publication
  const sql = `
    -- Add tables to supabase_realtime publication so Realtime works
    DO $$ BEGIN
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
      EXCEPTION WHEN duplicate_object THEN null; END;
      
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
      EXCEPTION WHEN duplicate_object THEN null; END;
      
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
      EXCEPTION WHEN duplicate_object THEN null; END;
    END $$;

    -- Ensure RLS policies allow realtime reads
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      CREATE POLICY "Users can read own notifications" ON notifications
        FOR SELECT USING (user_id = current_setting('app.user_id', true));
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Simpler open read policy as fallback (since we use anon key)
    DO $$ BEGIN
      CREATE POLICY "Allow public read notifications" ON notifications FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `

  console.log("Enabling Supabase Realtime on key tables...")
  const { data, error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("Error:", error)
  } else {
    console.log("Realtime publication updated! Notifications, community_messages and support_messages are now live-streaming.")
  }
}

enableRealtime()
