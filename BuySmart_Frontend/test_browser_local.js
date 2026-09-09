import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('Testing browser executable at:', executablePath);

async function test() {
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 15000 });
    const title = await page.title();
    console.log('Successfully loaded Home Page! Title:', title);
    await browser.close();
    console.log('Browser test successful!');
  } catch (err) {
    console.error('Puppeteer test error:', err.message);
  }
}

test();
