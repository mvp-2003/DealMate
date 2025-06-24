from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_settings_form_interaction(driver):
    """
    Tests that the settings form is interactive.
    This test will navigate to the settings page and print the source.
    """
    driver.get("http://localhost:3000/settings")
    wait = WebDriverWait(driver, 10)

    # Find the form and print the page source for debugging
    try:
        form = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "form")))
        assert form.is_displayed()
        print("Form found!")
        print(driver.page_source)
    except:
        print("Form not found!")
        print(driver.page_source)
        raise
