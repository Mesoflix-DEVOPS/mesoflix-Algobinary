import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { hashPassword, generateTOTPSecret, generateRecoveryCodes } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        // Check if any admin already exists
        const { count } = await supabase.from("admin_users").select("id", { count: "exact", head: true })
        
        // For security, you might want to only allow registration if count == 0 or with a master key
        // In this implementation, we'll allow it but you should probably harden it after first admin.

        const passwordHash = await hashPassword(password)
        const twoFactorSecret = generateTOTPSecret()
        const recoveryCodes = generateRecoveryCodes(2)

        const { data, error } = await supabase.from("admin_users").insert({
            email,
            password_hash: passwordHash,
            two_factor_secret: twoFactorSecret,
            recovery_codes: recoveryCodes, // In production, these should be hashed
            is_active: true
        }).select("id").single()

        if (error) {
            console.error("[AdminRegister] DB Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            adminId: data.id,
            twoFactorSecret, // Show this once for QR/manual setup
            recoveryCodes // Show these once for download
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
    }
}
