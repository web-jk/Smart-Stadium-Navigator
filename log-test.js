const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Tab 1: Client
  const clientPage = await context.newPage();
  clientPage.on('pageerror', err => console.log(`[CLIENT PAGE ERROR] ${err}`));
  clientPage.on('requestfailed', request => console.log(`[CLIENT REQ FAILED] ${request.url()}`));
  clientPage.on('console', msg => {
    console.log(`[CLIENT CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Tab 2: Admin
  const adminPage = await context.newPage();
  adminPage.on('console', msg => {
    if (msg.text().includes('[FIREBASE')) {
      console.log(`[ADMIN CONSOLE] ${msg.text()}`);
    }
  });

  console.log('Navigating Client...');
  await clientPage.goto('http://localhost:4200/');
  
  console.log('Waiting for Client Firebase to initialize...');
  await clientPage.waitForTimeout(2000);

  console.log('Navigating Admin...');
  await adminPage.goto('http://localhost:4200/admin/login');
  await adminPage.waitForTimeout(1000);
  
  // Log into admin
  await adminPage.fill('input[type="email"]', 'admin@stadium.com');
  await adminPage.fill('input[type="password"]', 'stadium@123');
  await adminPage.click('button[type="submit"]');
  
  console.log('Waiting for admin login to settle...');
  await adminPage.waitForTimeout(3000);
  
  console.log('Moving North Gate slider...');
  // Find the slider for North Gate. Assuming it's the first input type=range
  const sliders = await adminPage.$$('input[type="range"]');
  if (sliders.length > 0) {
    // Fill slider with small value
    await sliders[0].fill('10');
    // Dispatch input event to trigger angular binding
    await sliders[0].dispatchEvent('input');
  }
  
  console.log('Waiting to see if Client receives the update...');
  await clientPage.waitForTimeout(4000);
  
  await browser.close();
  console.log('Done mapping logs.');
})();
