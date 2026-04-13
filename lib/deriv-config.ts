/**
 * Shared configuration for Deriv V2 OAuth Migration.
 * Used to avoid hardcoding Client IDs and URLs across the application.
 */
export const derivConfig = {
    // Standard V2 OAuth Client ID
    CLIENT_ID: process.env.NEXT_PUBLIC_DERIV_CLIENT_ID || "32yJRED9hXmlYiayhK1VZ",
    
    // Numeric legacy App ID (only passed to websocket if specifically using legacy flow)
    LEGACY_APP_ID: process.env.NEXT_PUBLIC_DERIV_LEGACY_APP_ID || "114779",
    
    // OAuth Base URL
    OAUTH_URL: process.env.NEXT_PUBLIC_DERIV_OAUTH_BASE_URL || "https://oauth.deriv.com",
};
