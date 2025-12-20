#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');

async function generateBanner() {
  const htmlPath = path.join(__dirname, 'banner.html');
  const outputPath = path.join(__dirname, '..', 'banner.png');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport to match banner dimensions
  await page.setViewport({ width: 1400, height: 800 });

  console.log('Loading banner HTML...');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // Find the banner element and screenshot it
  const bannerElement = await page.$('.banner');

  console.log('Capturing screenshot...');
  await bannerElement.screenshot({
    path: outputPath,
    type: 'png',
    omitBackground: false
  });

  await browser.close();

  console.log(`Banner saved to: ${outputPath}`);
  console.log('Done!');
}

generateBanner().catch(console.error);
