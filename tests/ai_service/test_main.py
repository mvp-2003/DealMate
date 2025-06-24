import requests

BASE_URL = "http://localhost:8001"

def test_health_check():
    """
    Tests the AI service's health check endpoint.
    """
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
