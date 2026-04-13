import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { title, content, image_url, category, source } = body

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("trading_news")
            .insert({
                title,
                content,
                image_url: image_url || "https://images.unsplash.com/photo-1611974717482-48a0491a92e1?auto=format&fit=crop&q=80&w=800",
                category: category || "General",
                source: source || "Admin Desk"
            })
            .select()

        if (error) {
            console.error("[NewsAPI] Create Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("trading_news")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
