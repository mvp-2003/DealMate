#!/usr/bin/env node

/**
 * Build script for DealPal Browser Extension
 * Injects environment variables from .env file into the extension config
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Read the config template
const configPath = path.join(__dirname, 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace environment variables
const replacements = {
    'process.env.BROWSER_EXTENSION_GOOGLE_API_KEY || \'\'': 
        `'${process.env.BROWSER_EXTENSION_GOOGLE_API_KEY || ''}'`,
    'process.env.GEMINI_MODEL || \'gemini-1.5-flash\'': 
        `'${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}'`,
};

Object.entries(replacements).forEach(([search, replace]) => {
    configContent = configContent.replace(search, replace);
});

// Write the built config
const builtConfigPath = path.join(__dirname, 'config.built.js');
fs.writeFileSync(builtConfigPath, configContent);

console.log('Browser extension config built successfully!');
console.log(`Output: ${builtConfigPath}`);
console.log('\nIMPORTANT: Use config.built.js in your extension manifest.');
