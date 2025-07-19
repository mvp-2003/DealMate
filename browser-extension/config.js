/**
 * DealPal Browser Extension Configuration
 * IMPORTANT: API keys and secrets must be configured through the build process
 * DO NOT hardcode any secrets in this file!
 */

// Configuration loaded from build process or extension settings
const CONFIG = {
    // AI Service Configuration
    // This should be injected during build or loaded from extension storage
    GEMINI_API_KEY: process.env.BROWSER_EXTENSION_GOOGLE_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    
    // Service URLs
    RUST_BACKEND_URL: 'http://localhost:8000',
    PYTHON_AI_SERVICE_URL: 'http://localhost:8001',
    
    // Feature Flags
    ENABLE_LOCAL_AI: true,
    ENABLE_CLOUD_AI: true,
    ENABLE_PYTHON_AI_SERVICE: false,
    
    // Debug
    DEBUG: false
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.DEALPAL_CONFIG = CONFIG;
}
