#!/usr/bin/env python3
"""
Complete Authentication Flow Test for DealPal
Tests the entire Auth0 integration flow between Frontend and Backend
"""

import requests
import time
import os
from urllib.parse import urlparse, parse_qs
import json

class AuthFlowTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:9002"
        self.session = requests.Session()
        
    def test_backend_health(self):
        """Test if backend is running"""
        try:
            response = self.session.get(f"{self.backend_url}/")
            assert response.status_code == 200
            print("✅ Backend health check passed")
            return True
        except Exception as e:
            print(f"❌ Backend health check failed: {e}")
            return False
    
    def test_auth_endpoints_exist(self):
        """Test if auth endpoints are accessible"""
        endpoints = ["/auth/login", "/auth/signup", "/auth/logout"]
        
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{self.backend_url}{endpoint}", allow_redirects=False)
                # Should redirect to Auth0 (302) or return some response
                assert response.status_code in [200, 302, 307, 308]
                print(f"✅ {endpoint} endpoint accessible")
            except Exception as e:
                print(f"❌ {endpoint} endpoint failed: {e}")
                return False
        return True
    
    def test_login_redirect(self):
        """Test login redirect to Auth0"""
        try:
            response = self.session.get(f"{self.backend_url}/auth/login", allow_redirects=False)
            
            if response.status_code in [302, 307, 308]:
                location = response.headers.get('Location', '')
                parsed = urlparse(location)
                
                # Should redirect to Auth0 domain
                assert 'auth0.com' in parsed.netloc
                assert 'authorize' in parsed.path
                
                # Check required OAuth parameters
                params = parse_qs(parsed.query)
                required_params = ['response_type', 'client_id', 'redirect_uri', 'scope']
                
                for param in required_params:
                    assert param in params, f"Missing parameter: {param}"
                
                print("✅ Login redirect to Auth0 configured correctly")
                print(f"   Redirect URL: {location}")
                return True
            else:
                print(f"❌ Login endpoint returned {response.status_code} instead of redirect")
                return False
                
        except Exception as e:
            print(f"❌ Login redirect test failed: {e}")
            return False
    
    def test_signup_redirect(self):
        """Test signup redirect to Auth0"""
        try:
            response = self.session.get(f"{self.backend_url}/auth/signup", allow_redirects=False)
            
            if response.status_code in [302, 307, 308]:
                location = response.headers.get('Location', '')
                parsed = urlparse(location)
                params = parse_qs(parsed.query)
                
                # Should have screen_hint=signup for signup
                assert 'screen_hint' in params
                assert 'signup' in params['screen_hint']
                
                print("✅ Signup redirect configured correctly")
                return True
            else:
                print(f"❌ Signup endpoint returned {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Signup redirect test failed: {e}")
            return False
    
    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints require authentication"""
        try:
            response = self.session.get(f"{self.backend_url}/auth/me")
            assert response.status_code == 401
            print("✅ Protected endpoint correctly requires authentication")
            return True
        except Exception as e:
            print(f"❌ Protected endpoint test failed: {e}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization'
            }
            
            response = self.session.options(f"{self.backend_url}/auth/login", headers=headers)
            
            # Check CORS headers
            cors_headers = response.headers
            assert 'Access-Control-Allow-Origin' in cors_headers
            print("✅ CORS configuration present")
            return True
        except Exception as e:
            print(f"❌ CORS test failed: {e}")
            return False
    
    def test_environment_variables(self):
        """Test that required environment variables are set"""
        required_vars = [
            'AUTH0_DOMAIN',
            'AUTH0_CLIENT_ID', 
            'AUTH0_AUDIENCE',
            'FRONTEND_URL',
            'BACKEND_URL'
        ]
        
        # Load from .env file
        env_vars = {}
        try:
            with open('.env', 'r') as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        env_vars[key] = value
        except FileNotFoundError:
            print("❌ .env file not found")
            return False
        
        missing_vars = []
        for var in required_vars:
            if var not in env_vars or not env_vars[var] or env_vars[var] == 'your-auth0-client-secret-here':
                missing_vars.append(var)
        
        if missing_vars:
            print(f"❌ Missing or incomplete environment variables: {missing_vars}")
            return False
        
        print("✅ All required environment variables are set")
        return True
    
    def run_all_tests(self):
        """Run all authentication flow tests"""
        print("🚀 Starting DealPal Authentication Flow Tests\n")
        
        tests = [
            ("Environment Variables", self.test_environment_variables),
            ("Backend Health", self.test_backend_health),
            ("Auth Endpoints", self.test_auth_endpoints_exist),
            ("Login Redirect", self.test_login_redirect),
            ("Signup Redirect", self.test_signup_redirect),
            ("Protected Endpoint", self.test_protected_endpoint_without_token),
            ("CORS Configuration", self.test_cors_configuration),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Testing: {test_name}")
            if test_func():
                passed += 1
            time.sleep(0.5)  # Small delay between tests
        
        print(f"\n📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Authentication flow is properly configured.")
            print("\n📋 Next Steps:")
            print("1. Add your Auth0 client secret to .env file")
            print("2. Configure Auth0 Dashboard with callback URLs")
            print("3. Start both services and test manual login flow")
        else:
            print("⚠️  Some tests failed. Please check the configuration.")
        
        return passed == total

if __name__ == "__main__":
    tester = AuthFlowTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)