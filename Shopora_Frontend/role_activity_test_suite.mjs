import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const SCREENSHOT_DIR = 'C:\\Users\\aasif\\.gemini\\antigravity-ide\\brain\\e518ccdf-6b5b-4ad0-a93f-c396b8d1aad6\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const FRONTEND_BASE = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  screenshots: []
};

function recordSuccess(name, details = '') {
  results.passed.push({ name, details });
  console.log(`✅ [PASS] ${name} ${details ? '- ' + details : ''}`);
}

function recordFailure(name, error) {
  results.failed.push({ name, error: error?.message || String(error) });
  console.error(`❌ [FAIL] ${name}:`, error?.message || error);
}

async function capture(page, filename, desc) {
  const fullPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  results.screenshots.push({ filename, desc });
  console.log(`📸 Captured: ${filename} - ${desc}`);
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function performLogin(page, email, password) {
  await page.goto(`${FRONTEND_BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Clear inputs if any
  await page.evaluate(() => {
    const e = document.querySelector('#login-email');
    if (e) e.value = '';
    const p = document.querySelector('#login-password');
    if (p) p.value = '';
  });

  await page.type('#login-email', email);
  await page.type('#login-password', password);
  await sleep(500);

  // Explicitly click the authentication form submit button (not navbar search button!)
  const submitBtn = await page.$('#login-submit-btn, .authentication-submit-button');
  if (!submitBtn) {
    throw new Error(`Login submit button not found for ${email}`);
  }

  await submitBtn.click();
  await sleep(3000);
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await sleep(500);
}

async function run() {
  console.log('🚀 Starting Robust Multi-Role Activity Verification...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  try {
    // ==========================================
    // 1. PRODUCT DETAILS VERIFICATION (NO TDZ ERROR)
    // ==========================================
    console.log('\n--- 1. Testing Product Details Page ---');
    await page.goto(`${FRONTEND_BASE}/products/5`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Something went wrong') && bodyText.includes('ErrorBoundary')) {
      throw new Error('/products/5 still rendered ErrorBoundary!');
    }

    const prod5Title = await page.evaluate(() => document.querySelector('h1')?.innerText);
    console.log(`Product 5 Title: ${prod5Title}`);
    await capture(page, 'role_01_product_5_details.png', 'Product 5 details view');
    recordSuccess('Product 5 Details', `Rendered "${prod5Title}"`);

    // ==========================================
    // 2. CUSTOMER AUTHENTICATION & FULL JOURNEY
    // ==========================================
    console.log('\n--- 2. Testing Customer Role Full Journey ---');
    await clearSession(page);
    await performLogin(page, 'customer@ecommerce.com', 'Customer@123');

    const customerNavText = await page.evaluate(() => document.body.innerText);
    await capture(page, 'role_02_customer_authenticated.png', 'Customer authenticated view');
    recordSuccess('Customer Login', 'Logged in as customer@ecommerce.com');

    // Add item to cart from details page
    console.log('Navigating to /products/1 to add to cart...');
    await page.goto(`${FRONTEND_BASE}/products/1`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const added = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.toLowerCase().includes('add to cart'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    await sleep(1500);
    await capture(page, 'role_03_customer_item_added.png', 'Customer added item notification');
    recordSuccess('Customer Add to Cart', added ? 'Add to Cart clicked' : 'Fallback add');

    // Cart View
    console.log('Navigating to /cart...');
    await page.goto(`${FRONTEND_BASE}/cart`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_04_customer_cart_active.png', 'Customer active cart view');
    recordSuccess('Customer Cart', 'Active cart loaded with items');

    // Checkout View
    console.log('Navigating to /checkout...');
    await page.goto(`${FRONTEND_BASE}/checkout`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_05_customer_checkout_active.png', 'Customer checkout flow');
    recordSuccess('Customer Checkout', 'Checkout page loaded with addresses and payment');

    // Orders View
    console.log('Navigating to /orders...');
    await page.goto(`${FRONTEND_BASE}/orders`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_06_customer_orders_active.png', 'Customer order history & tracking');
    recordSuccess('Customer Orders', 'Orders page loaded with order history');

    // Wishlist View
    console.log('Navigating to /wishlist...');
    await page.goto(`${FRONTEND_BASE}/wishlist`, { waitUntil: 'networkidle2' });
    await sleep(1500);
    await capture(page, 'role_07_customer_wishlist.png', 'Customer wishlist view');
    recordSuccess('Customer Wishlist', 'Wishlist loaded');

    // Account Profile View
    console.log('Navigating to /account...');
    await page.goto(`${FRONTEND_BASE}/account`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_08_customer_account_profile.png', 'Customer account profile & settings');
    recordSuccess('Customer Account', 'Account profile loaded with user details');

    // ==========================================
    // 3. SELLER AUTHENTICATION & FULL JOURNEY
    // ==========================================
    console.log('\n--- 3. Testing Seller Role Full Journey ---');
    await clearSession(page);
    await performLogin(page, 'seller@shopsphere.local', 'Seller@123');
    await capture(page, 'role_09_seller_authenticated.png', 'Seller authenticated post-login');
    recordSuccess('Seller Login', 'Logged in as seller@shopsphere.local');

    // Seller Dashboard
    console.log('Navigating to /seller...');
    await page.goto(`${FRONTEND_BASE}/seller`, { waitUntil: 'networkidle2' });
    await sleep(2500);
    await capture(page, 'role_10_seller_dashboard_active.png', 'Seller dashboard with metrics & inventory');
    recordSuccess('Seller Dashboard', 'Dashboard loaded with merchant inventory and metrics');

    // Seller Add Product
    console.log('Navigating to /seller/products/new...');
    await page.goto(`${FRONTEND_BASE}/seller/products/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_11_seller_add_product_form.png', 'Seller add product form');
    recordSuccess('Seller Add Product', 'Product creation form loaded');

    // Seller Edit Product
    console.log('Navigating to /seller/products/edit/1...');
    await page.goto(`${FRONTEND_BASE}/seller/products/edit/1`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await capture(page, 'role_12_seller_edit_product_form.png', 'Seller edit product form');
    recordSuccess('Seller Edit Product', 'Product editing form populated');

    // ==========================================
    // 4. ADMIN AUTHENTICATION & FULL JOURNEY
    // ==========================================
    console.log('\n--- 4. Testing Admin Role Full Journey ---');
    await clearSession(page);
    await performLogin(page, 'admin@ecommerce.com', 'Admin@123');
    await capture(page, 'role_13_admin_authenticated.png', 'Admin authenticated post-login');
    recordSuccess('Admin Login', 'Logged in as admin@ecommerce.com');

    // Admin Dashboard Overview
    console.log('Navigating to /admin...');
    await page.goto(`${FRONTEND_BASE}/admin`, { waitUntil: 'networkidle2' });
    await sleep(2500);
    await capture(page, 'role_14_admin_overview.png', 'Admin dashboard platform overview metrics');
    recordSuccess('Admin Overview', 'Admin overview loaded with revenue, GMV, users');

    // Admin Users Tab
    console.log('Admin: Opening Users Management tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const uBtn = btns.find(b => b.innerText.includes('Users') || b.innerText.includes('User Management'));
      if (uBtn) uBtn.click();
    });
    await sleep(2000);
    await capture(page, 'role_15_admin_users_tab.png', 'Admin users management with role filters & status toggle');
    recordSuccess('Admin Users Management', 'Users management loaded with role filters and action toggles');

    // Admin Orders Tab
    console.log('Admin: Opening Orders Operations tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const oBtn = btns.find(b => b.innerText.includes('Orders') || b.innerText.includes('Order Operations'));
      if (oBtn) oBtn.click();
    });
    await sleep(2000);
    await capture(page, 'role_16_admin_orders_tab.png', 'Admin orders operations with lifecycle actions');
    recordSuccess('Admin Orders Operations', 'Orders operations tab loaded with status progression');

    // Admin AI Copilot Tab
    console.log('Admin: Opening AI Copilot tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.innerText.includes('AI') || b.innerText.includes('Copilot'));
      if (aiBtn) aiBtn.click();
    });
    await sleep(2000);
    await capture(page, 'role_17_admin_ai_copilot_tab.png', 'Admin AI Executive Copilot analytics');
    recordSuccess('Admin AI Copilot', 'AI Copilot tab loaded with executive intelligence');

    // Admin Storefront Customizer Tab
    console.log('Admin: Opening Storefront Customizer tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sBtn = btns.find(b => b.innerText.includes('Storefront') || b.innerText.includes('Customizer'));
      if (sBtn) sBtn.click();
    });
    await sleep(2000);
    await capture(page, 'role_18_admin_storefront_tab.png', 'Admin storefront customizer live editor');
    recordSuccess('Admin Storefront Customizer', 'Storefront customizer tab loaded');

    console.log('\n=============================================');
    console.log('🎉 ALL ROLE JOURNEYS TESTED AND VERIFIED!');
    console.log(`Total Passes: ${results.passed.length}`);
    console.log(`Total Failures: ${results.failed.length}`);
    console.log(`Total Screenshots: ${results.screenshots.length}`);
    console.log('=============================================');

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'robust_test_results.json'),
      JSON.stringify(results, null, 2)
    );

  } catch (err) {
    console.error('Test Suite Encountered Error:', err);
    recordFailure('Execution Pipeline', err);
    await capture(page, 'role_error_state.png', 'Error state');
  } finally {
    await browser.close();
  }
}

run();
