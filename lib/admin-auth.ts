import crypto from "crypto"
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

// Standard TOTP Base32 Implementation (compatible with Google Authenticator)
export function generateTOTPSecret() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const bytes = require("crypto").randomBytes(10) // 80 bits is standard
  let secret = ""
  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[bytes[i] % 32]
  }
  return secret
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
