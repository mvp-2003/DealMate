from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_dashboard_loads_and_has_correct_title(driver):
    """
    Tests if the dashboard page loads correctly and has the expected title.
    """
    driver.get("http://localhost:3000/dashboard")
    WebDriverWait(driver, 10).until(EC.title_contains("DealMate"))
    assert "DealMate" in driver.title

def test_dashboard_displays_header_and_chart(driver):
    """
    Tests if the main header and chart are visible on the dashboard page.
    """
    driver.get("http://localhost:3000/dashboard")
    wait = WebDriverWait(driver, 10)

    # Check for a heading
    header = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
    assert header.is_displayed()

    # Check for a chart container
    chart = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".recharts-wrapper")))
    assert chart.is_displayed(), "Chart was not displayed on the dashboard"
