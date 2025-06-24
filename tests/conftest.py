import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="function")
def driver():
    """
    Fixture to initialize and quit the Selenium WebDriver for each test function.
    """
    # Setup WebDriver
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Run in headless mode for CI/CD environments
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    yield driver
    
    # Teardown WebDriver
    driver.quit()
