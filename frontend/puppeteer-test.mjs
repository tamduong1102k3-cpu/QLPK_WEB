import puppeteer from 'puppeteer';

const SCREENSHOT_DIR = 'screenshots';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1366, height: 768 } 
  });
  const page = await browser.newPage();

  // 1. Navigate to app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });
  console.log('1. Login page loaded');

  // 2. Fill login form - use element id
  await page.type('#identity', 'cdha@gmail.com', { delay: 30 });
  await page.type('#password', '123456', { delay: 30 });
  console.log('2. Filled login form');

  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-form-filled.png`, fullPage: true });

  // 3. Click login button (the submit button)
  await page.click('button[type="submit"]');
  console.log('3. Clicked login button');

  // Wait for navigation / dashboard to load
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login.png`, fullPage: true });
  
  // Print all text on page
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('Page text after login:', pageText);

  // 4. Look for the "Xac nhan DV" tab button
  const buttons = await page.$$('button');
  console.log('\nAll buttons on page:');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].evaluate(el => el.textContent.trim().replace(/\s+/g, ' ').substring(0, 60));
    console.log(`  Button ${i}: "${text}"`);
  }

  // Find and click the tab with "Xac nhan DV" or "Xác nhận DV"
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].evaluate(el => el.textContent.trim());
    if (text.includes('Xac nhan') || text.includes('Xác nhận')) {
      console.log(`5. Found Xac Nhan DV tab at button ${i}: "${text}"`);
      await buttons[i].click();
      break;
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-tab-xac-nhan-dv.png`, fullPage: true });

  // 5. Find "XAC NHAN" button (capital, the action button on each patient card)
  const allElements = await page.$$('button');
  console.log('\nSearching for XAC NHAN action button...');
  for (let i = 0; i < allElements.length; i++) {
    const text = await allElements[i].evaluate(el => el.textContent.trim().replace(/\s+/g, ' '));
    if (text === 'XAC NHAN') {
      console.log(`6. Found XAC NHAN action button at ${i}`);
      // Click the action button to open modal
      await allElements[i].click();
      console.log('   Clicked XAC NHAN!');
      break;
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-modal-open.png`, fullPage: true });

  // Get modal content
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) return modal.innerText.substring(0, 1000);
    return 'No modal found';
  });
  console.log('\nModal content:\n', modalText);

  // Get page title/URL
  console.log('\nCurrent URL:', page.url());

  // Take a final clean screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-final-ui.png`, fullPage: true });

  console.log('\nDone! All screenshots saved in screenshots/ folder.');
  
  // Keep browser open for 10 seconds for manual viewing
  await page.waitForTimeout(10000);
  await browser.close();
})();