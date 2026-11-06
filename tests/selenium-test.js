// Selenium browser test. Start the application first, then run: node tests/selenium-test.js
// Requires Google Chrome and a compatible ChromeDriver (Selenium Manager may download/manage it).
const { Builder, By, until } = require('selenium-webdriver');

(async function hospitalBookingTest() {
  let driver;
  try {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get('http://localhost:3000');
    await driver.wait(until.titleContains('CarePoint'), 10000);

    const heading = await driver.findElement(By.css('h1')).getText();
    if (!heading.toLowerCase().includes('book your doctor appointment')) {
      throw new Error('Home page heading was not displayed.');
    }

    await driver.findElement(By.id('specialization-search')).sendKeys('Cardiology');
    await driver.findElement(By.id('search-button')).click();
    await driver.wait(until.elementLocated(By.css('.doctor-card')), 5000);
    const doctorText = await driver.findElement(By.css('.doctor-card')).getText();
    if (!doctorText.includes('Cardiology')) throw new Error('Specialization search did not return Cardiology.');

    console.log('PASS: home page loads and doctor specialization search works.');
  } catch (error) {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  } finally {
    if (driver) await driver.quit();
  }
})();
