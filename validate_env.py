#!/usr/bin/env python3
"""
Environment Validation Script for DealPal
Validates Railway and Gemini configuration
"""

import os
import sys
import asyncio
from urllib.parse import urlparse
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    import asyncpg # type: ignore

def check_env_var(name: str, required: bool = True) -> bool:
    """Check if environment variable exists"""
    value: Optional[str] = os.getenv(name)
    if required and not value:
        print(f"❌ Missing required environment variable: {name}")
        return False
    elif value:
        print(f"✅ {name}: {'*' * min(len(value), 20)}...")
        return True
    else:
        print(f"⚠️  Optional environment variable not set: {name}")
        return True

def validate_database_url(url: str) -> bool:
    """Validate database URL format"""
    try:
        parsed = urlparse(str(url))
        if parsed.scheme != 'postgresql':
            print(f"❌ Invalid database scheme: {parsed.scheme}")
            return False
        if not parsed.hostname:
            print("❌ Missing database hostname")
            return False
        if not parsed.port:
            print("❌ Missing database port")
            return False
        print(f"✅ Database URL valid: {parsed.hostname}:{parsed.port}")
        return True
    except Exception as e:
        print(f"❌ Invalid database URL: {e}")
        return False

async def test_gemini_api(api_key: str) -> bool:
    """Test Gemini API connectivity"""
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key) # type: ignore
        model = genai.GenerativeModel('gemini-1.5-flash') # type: ignore
        
        # Simple test
        response = await model.generate_content_async("Hello, respond with 'OK'") # type: ignore
        if response and response.text:
            print("✅ Gemini API working")
            return True
        else:
            print("❌ Gemini API not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")
        return False

async def test_railway_database(db_url: str) -> bool:
    """Test Railway database connectivity"""
    try:
        import asyncpg  # type: ignore
        conn: "asyncpg.Connection" = await asyncpg.connect(db_url) # type: ignore
        result = await conn.fetchval('SELECT 1') # type: ignore
        await conn.close() # type: ignore
        if result == 1:
            print("✅ Railway database connection successful")
            return True
        else:
            print("❌ Railway database query failed")
            return False
    except Exception as e:
        print(f"❌ Railway database connection failed: {e}")
        return False

async def main():
    print("🔍 DealPal Environment Validation")
    print("=" * 40)
    
    all_good = True
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    all_good &= check_env_var("GOOGLE_API_KEY", required=True)
    all_good &= check_env_var("DATABASE_URL", required=False)
    all_good &= check_env_var("GEMINI_MODEL", required=False)
    all_good &= check_env_var("REDIS_URL", required=False)
    
    # Check master .env file
    print("\n🔌 Master Environment Configuration:")
    master_env_path = ".env"
    if os.path.exists(master_env_path):
        print(f"✅ Master .env found: {master_env_path}")
        # Check if it contains essential keys
        try:
            with open(master_env_path, 'r') as f:
                content = f.read()
                
                # Check for Google API key
                if "GOOGLE_API_KEY=" in content and "your_" not in content.lower():
                    print("✅ GOOGLE_API_KEY configured in master .env")
                elif "GOOGLE_API_KEY=" in content:
                    print("⚠️  GOOGLE_API_KEY needs to be set in master .env")
                    all_good = False
                else:
                    print("❌ Master .env missing GOOGLE_API_KEY")
                    all_good = False
                    
                # Check for Database URL
                if "DATABASE_URL=" in content and "postgresql://" in content:
                    print("✅ DATABASE_URL configured in master .env")
                else:
                    print("❌ Master .env missing or invalid DATABASE_URL")
                    all_good = False
                    
        except Exception as e:
            print(f"❌ Error reading master .env: {e}")
            all_good = False
    else:
        print(f"❌ Master .env missing: {master_env_path}")
        print("💡 Create it with proper environment variables")
        all_good = False
    
    # Validate database URL
    print("\n🗄️  Database Configuration:")
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        all_good &= validate_database_url(db_url)
        
        # Test Railway connection
        print("\n🚂 Railway Database Test:")
        try:
            all_good &= await test_railway_database(db_url)
        except ImportError:
            print("⚠️  asyncpg not installed, skipping database test")
    
    # Test Gemini API
    print("\n🤖 Gemini API Test:")
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            all_good &= await test_gemini_api(api_key)
        except ImportError:
            print("⚠️  google-generativeai not installed, skipping API test")
    
    # Summary
    print("\n" + "=" * 40)
    if all_good:
        print("✅ All validations passed!")
        print("🚀 DealPal is ready for deployment")
    else:
        print("❌ Some validations failed")
        print("🔧 Please fix the issues above")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
