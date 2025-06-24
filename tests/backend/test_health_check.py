import requests

BASE_URL = "http://localhost:8000"

def test_health_check():
    """
    Tests the backend's health check endpoint.
    """
    response = requests.get(f"{BASE_URL}/health_check")
    assert response.status_code == 200
    assert response.text == "OK"
