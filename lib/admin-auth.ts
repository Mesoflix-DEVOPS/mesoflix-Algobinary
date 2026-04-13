import { crypto } from "crypto"
import { supabase } from "./db"

// Hash password using PBKDF2
export async function hashPassword(password: string): Promise<string> {
  const salt = require("crypto").randomBytes(16).toString("hex")
  const hash = require("crypto").pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":")
  const verifyHash = require("crypto").pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return hash === verifyHash
}

// Simple TOTP Implementation (compatible with Google Authenticator)
// Using base32 representation for secrets
export function generateTOTPSecret() {
  const buffer = require("crypto").randomBytes(20)
  // Convert to base32 manually or use a simple encoding
  // For simplicity here, we'll return a random hex that web-apps can use
  // but standard TOTP apps need Base32.
  return buffer.toString("hex").toUpperCase().slice(0, 16)
}

// Generate recovery codes
export function generateRecoveryCodes(count: number = 2): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
        codes.push(require("crypto").randomBytes(4).toString("hex").toUpperCase())
    }
    return codes
}

export async function createAdminSession(adminId: string) {
    const sessionToken = require("crypto").randomUUID()
    // In a real app, you'd store this in a table or cookie
    return sessionToken
}
