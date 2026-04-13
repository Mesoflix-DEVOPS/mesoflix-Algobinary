/**
 * Moderation Engine for Derivex Community
 * "The Guard"
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

// Kenyan Phone Patterns: +254..., 07..., 01...
const KENYAN_PHONE_REGEX = /(\+?254|0)(7|1)\d{8}/g;

// International Phone Pattern (General)
const GENERAL_PHONE_REGEX = /(\+?\d{1,4}[-.\s]?\d{1,12})/g;

// Accusatory / Toxic Keywords
const TOXIC_KEYWORDS = [
  "scam", "fake", "thief", "thieves", "fraud", "fraudulent", 
  "stolen", "stole", "con", "conman", "conartist", "liar"
];

interface ModerationResult {
  allowed: boolean;
  reason?: string;
  cleanedText?: string;
}

export function moderateMessage(text: string): ModerationResult {
  const content = text.toLowerCase();

  // 1. Check for Emails
  if (EMAIL_REGEX.test(content)) {
    return {
      allowed: false,
      reason: "Sharing email addresses is prohibited for security reasons."
    };
  }

  // 2. Check for Phone Numbers (Strong enforcement for Kenyan & General formats)
  const phoneMatches = content.match(KENYAN_PHONE_REGEX) || content.match(GENERAL_PHONE_REGEX);
  if (phoneMatches && phoneMatches.some(m => m.replace(/[^0-9]/g, '').length >= 9)) {
    return {
      allowed: false,
      reason: "Sharing phone numbers is strictly prohibited to prevent scams."
    };
  }

  // 3. Check for Accusatory/Toxic Language
  for (const word of TOXIC_KEYWORDS) {
    if (content.includes(word)) {
      return {
        allowed: false,
        reason: "Aggressive or accusatory language is not permitted. Please contact support for disputes."
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates a nickname according to platform rules
 */
export function validateNickname(name: string): string | null {
  if (!name || name.length < 3) return "Nickname must be at least 3 characters.";
  if (name.length > 20) return "Nickname cannot exceed 20 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return "Nickname can only contain letters, numbers, and underscores.";
  
  const lower = name.toLowerCase();
  if (lower.includes("admin") || lower.includes("support") || lower.includes("staff")) {
    return "Reserved word detected in nickname.";
  }
  
  return null;
}
