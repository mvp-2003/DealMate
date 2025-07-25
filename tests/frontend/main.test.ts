import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { Options as EdgeOptions } from 'selenium-webdriver/edge';

const browsers = ['chrome', 'edge'];

browsers.forEach(browserName => {
  describe(`Frontend Tests - ${browserName}`, () => {
    let driver: WebDriver;

    beforeAll(async () => {
      let options;
      if (browserName === 'chrome') {
        options = new ChromeOptions();
      } else {
        options = new EdgeOptions();
      }
      // The next line assumes you are running selenium-server in a docker container
      // and that the container is on the same network as this test runner.
      // If you are running selenium-server on your host, you may need to change this to
      // 'http://host.docker.internal:4444/wd/hub' or 'http://localhost:4444/wd/hub'
      driver = await new Builder()
        .forBrowser(browserName)
        .setChromeOptions(options)
        .usingServer('http://selenium-hub:4444/wd/hub')
        .build();
    });

    afterAll(async () => {
      await driver.quit();
    });

    test('should have the correct page title', async () => {
      // The next line assumes that the frontend is running on http://frontend:3000
      // from the perspective of the selenium-server container.
      // If you are running the frontend on your host, you may need to change this to
      // 'http://host.docker.internal:3000' or 'http://localhost:3000'
      await driver.get('http://frontend:3000');
      const title = await driver.getTitle();
      expect(title).toBe('DealMate');
    }, 30000);
  });
});
