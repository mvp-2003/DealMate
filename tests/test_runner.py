import subprocess
import requests
import time
import sys

# Define the services and their health check URLs
SERVICES = {
    "Frontend": "http://localhost:3000",
    "Backend": "http://localhost:8000/health_check",
    "AI Service": "http://localhost:8001/health",
}

def check_service(name, url):
    """Checks the health of a single service."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"✅ {name} is running.")
            return True
        else:
            print(f"❌ {name} returned status code {response.status_code}.")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {name} is not accessible at {url}. Error: {e}")
        return False

def main():
    """
    Main function to check all services and run tests if all are healthy.
    """
    print("--- Checking Service Status ---")
    all_healthy = True
    for name, url in SERVICES.items():
        if not check_service(name, url):
            all_healthy = False

    if not all_healthy:
        print("\nNot all services are running. Aborting tests.")
        sys.exit(1)

    print("\n--- Running Test Suite ---")
    try:
        # Run pytest
        result = subprocess.run(["pytest", "tests/"], check=True)
        print("\n--- Test Suite Finished ---")
        if result.returncode == 0:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed.")
    except FileNotFoundError:
        print("\n❌ 'pytest' command not found. Make sure it's installed (`pip install pytest`).")
        sys.exit(1)
    except subprocess.CalledProcessError:
        # The subprocess.run with check=True will raise this error on non-zero exit codes.
        # The output from pytest will already be on the console.
        print("\n--- Test Suite Finished with Failures ---")
        sys.exit(1)

if __name__ == "__main__":
    main()
