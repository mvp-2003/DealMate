from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_navigation_to_settings_page(driver):
    """
    Tests navigation from the dashboard to the settings page.
    """
    driver.get("http://localhost:3000/dashboard")
    wait = WebDriverWait(driver, 10)

    # Find and click the "Settings" link within the main navigation
    settings_link_selector = (By.CSS_SELECTOR, "nav a[href*='settings']")
    settings_link = wait.until(EC.element_to_be_clickable(settings_link_selector))
    settings_link.click()

    # Verify the URL has changed
    wait.until(EC.url_contains("/settings"))
    assert "/settings" in driver.current_url

    # Verify the content of the new page
    header = wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Settings')] | //h2[contains(text(), 'Settings')]")))
    assert "Settings" in header.text, f"Header text was '{header.text}' instead of containing 'Settings'"
