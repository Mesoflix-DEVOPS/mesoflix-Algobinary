import { createClient } from "@supabase/supabase-js"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function migrate() {
    console.log("Starting Auth Flow migration...")
    
    const sqlPath = path.join(__dirname, "03_auth_flow.sql")
    if (!fs.existsSync(sqlPath)) {
        console.error("Migration SQL file not found:", sqlPath)
        process.exit(1)
    }
    const sql = fs.readFileSync(sqlPath, "utf8")
    
    const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0)

    for (const statement of statements) {
        if (statement.startsWith("--")) continue; // basic comment skip
        
        console.log(`Executing statement: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc("exec_sql", { sql: statement })
        
        if (error) {
            console.error("Migration error:", error)
        } else {
            console.log("Statement executed successfully.")
        }
    }
    
    console.log("Auth Flow migration complete.")
}

migrate()
