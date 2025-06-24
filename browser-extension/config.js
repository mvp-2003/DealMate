/**
 * DealPal Browser Extension Configuration
 * Loads environment variables from the master .env file
 */

// Environment variables loaded from master .env file
const CONFIG = {
    // AI Service Configuration
    GEMINI_API_KEY: 'AIzaSyA0gf53rhugs-zCHLxii14II2AX-FTqeAM',
    GEMINI_MODEL: 'gemini-1.5-flash',
    
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