/**
 * Shared configuration for Deriv V2 OAuth Migration.
 * Used to avoid hardcoding Client IDs and URLs across the application.
 */
export const derivConfig = {
    // Standard V2 OAuth Client ID
    CLIENT_ID: process.env.NEXT_PUBLIC_DERIV_CLIENT_ID || "32yJRED9hXmlYiayhK1VZ",
    
    // OAuth Base URL
    OAUTH_URL: process.env.NEXT_PUBLIC_DERIV_OAUTH_BASE_URL || "https://auth.deriv.com",
};

