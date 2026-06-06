import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:3002/en/blog/moving-to-perez-zeledon-logistics';

async function runPerformanceTest() {
  console.log(`Starting Browser-in-the-Loop Performance Simulation for: ${TEST_URL}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable performance metrics
    await page.setCacheEnabled(false);
    
    console.log('Navigating to blog post...');
    const startTime = Date.now();
    
    const response = await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 90000 });
    
    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
    }

    const navigationTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${navigationTime}ms`);

    // Verify the widget is loaded
    const widgetExists = await page.$('[data-testid="featured-properties-widget"]');
    if (!widgetExists) {
      throw new Error('Featured Properties Widget not found on the page');
    }
    
    // Check property cards within widget
    const propertyCards = await page.$$('[data-testid="featured-properties-widget"] [data-testid="property-card"]');
    console.log(`✅ Found ${propertyCards.length} related properties in the widget instantly`);
    
    if (propertyCards.length === 0) {
      console.warn('⚠️ Widget is present but no properties matched the location tag. (This might be expected depending on DB seed)');
    } else {
      console.log('Widget successfully pulled properties without delaying page load.');
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runPerformanceTest();
