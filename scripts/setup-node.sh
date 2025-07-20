#!/bin/bash

echo "🔧 DealPal Node.js Version Setup"
echo "================================"

# Check if nvm is installed
if command -v nvm &> /dev/null; then
    echo "✅ nvm is already installed"
    
    # Install and use Node.js 20
    echo "📦 Installing Node.js v20 (LTS)..."
    nvm install 20
    nvm use 20
    
    echo "✅ Switched to Node.js v20"
    node --version
    
elif command -v brew &> /dev/null; then
    echo "📦 Installing nvm via Homebrew..."
    brew install nvm
    
    # Setup nvm
    echo "🔧 Setting up nvm..."
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
    echo '[ -s "/opt/homebrew/bin/nvm" ] && \. "/opt/homebrew/bin/nvm"' >> ~/.zshrc
    echo '[ -s "/opt/homebrew/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/etc/bash_completion.d/nvm"' >> ~/.zshrc
    
    # Source the profile
    source ~/.zshrc
    
    echo "📦 Installing Node.js v20..."
    nvm install 20
    nvm use 20
    
else
    echo "❌ Neither nvm nor Homebrew found"
    echo "Please install nvm manually from: https://github.com/nvm-sh/nvm"
    echo "Or install Homebrew from: https://brew.sh"
    echo ""
    echo "Alternative: Download Node.js v20 directly from: https://nodejs.org"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Run: nvm use 20"
echo "2. Run: npm install"
echo "3. Run: npm run build"
