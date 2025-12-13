/**
 * Firebase Website Testing Script
 * Tests the Eyes of Azrael website locally
 *
 * Requirements:
 * - Local HTTP server running on port 8000
 * - Node.js installed
 *
 * Usage:
 * node test-firebase-site.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:8000';
const RESULTS_FILE = 'H:\\Github\\EyesOfAzrael\\test-results.json';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

// Pages to test
const pagesToTest = [
  {
    name: 'Main Index',
    url: '/',
    expectedTitle: 'Eyes of Azrael',
    isMaintenance: true
  },
  {
    name: 'Greek Mythology',
    url: '/mythos/greek/index.html',
    mythology: 'greek',
    expectedTitle: 'Greek Mythology'
  },
  {
    name: 'Norse Mythology',
    url: '/mythos/norse/index.html',
    mythology: 'norse',
    expectedTitle: 'Norse Mythology'
  },
  {
    name: 'Egyptian Mythology',
    url: '/mythos/egyptian/index.html',
    mythology: 'egyptian',
    expectedTitle: 'Egyptian Mythology'
  },
  {
    name: 'Hindu Mythology',
    url: '/mythos/hindu/index.html',
    mythology: 'hindu',
    expectedTitle: 'Hindu Mythology'
  },
  {
    name: 'Christian Mythology',
    url: '/mythos/christian/index.html',
    mythology: 'christian',
    expectedTitle: 'Christian'
  }
];

// Utility: Fetch URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          loadTime: loadTime
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Test 1: Check if page loads
async function testPageLoads(page) {
  const test = {
    name: `${page.name} - Page Loads`,
    status: 'pending',
    details: {}
  };

  try {
    const url = BASE_URL + page.url;
    console.log(`Testing: ${url}`);

    const response = await fetchUrl(url);

    test.details.statusCode = response.statusCode;
    test.details.loadTime = response.loadTime;
    test.details.contentLength = response.body.length;

    if (response.statusCode === 200) {
      test.status = 'passed';
      test.details.message = `Page loaded successfully in ${response.loadTime}ms`;
    } else {
      test.status = 'failed';
      test.details.message = `Unexpected status code: ${response.statusCode}`;
    }

    return { test, response };

  } catch (error) {
    test.status = 'failed';
    test.details.error = error.message;
    return { test, response: null };
  }
}

// Test 2: Check HTML structure
function testHtmlStructure(page, response) {
  const test = {
    name: `${page.name} - HTML Structure`,
    status: 'pending',
    details: {}
  };

  if (!response || !response.body) {
    test.status = 'skipped';
    test.details.message = 'No response body to test';
    return test;
  }

  const html = response.body;
  const checks = [];

  // Check for DOCTYPE
  if (html.includes('<!DOCTYPE html>')) {
    checks.push({ check: 'DOCTYPE', passed: true });
  } else {
    checks.push({ check: 'DOCTYPE', passed: false });
  }

  // Check for title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    checks.push({
      check: 'Title tag',
      passed: true,
      value: titleMatch[1]
    });

    // Verify expected title
    if (page.expectedTitle && titleMatch[1].includes(page.expectedTitle)) {
      checks.push({ check: 'Expected title', passed: true });
    } else if (page.expectedTitle) {
      checks.push({
        check: 'Expected title',
        passed: false,
        expected: page.expectedTitle,
        actual: titleMatch[1]
      });
    }
  } else {
    checks.push({ check: 'Title tag', passed: false });
  }

  // Check for meta viewport
  if (html.includes('name="viewport"')) {
    checks.push({ check: 'Viewport meta', passed: true });
  } else {
    checks.push({ check: 'Viewport meta', passed: false });
  }

  // Check for charset
  if (html.includes('charset="UTF-8"') || html.includes('charset=\'UTF-8\'')) {
    checks.push({ check: 'UTF-8 charset', passed: true });
  } else {
    checks.push({ check: 'UTF-8 charset', passed: false });
  }

  test.details.checks = checks;

  const failedChecks = checks.filter(c => !c.passed);
  if (failedChecks.length === 0) {
    test.status = 'passed';
  } else if (failedChecks.length < checks.length) {
    test.status = 'warning';
    test.details.message = `${failedChecks.length} checks failed`;
  } else {
    test.status = 'failed';
  }

  return test;
}

// Test 3: Check Firebase integration
function testFirebaseIntegration(page, response) {
  const test = {
    name: `${page.name} - Firebase Integration`,
    status: 'pending',
    details: {}
  };

  if (!response || !response.body) {
    test.status = 'skipped';
    test.details.message = 'No response body to test';
    return test;
  }

  const html = response.body;
  const checks = [];

  // Skip Firebase checks for maintenance page
  if (page.isMaintenance) {
    test.status = 'skipped';
    test.details.message = 'Page is in maintenance mode';
    return test;
  }

  // Check for Firebase SDK
  if (html.includes('firebasejs') || html.includes('firebase-app')) {
    checks.push({ check: 'Firebase SDK included', passed: true });
  } else {
    checks.push({ check: 'Firebase SDK included', passed: false });
  }

  // Check for firebase-config.js
  if (html.includes('firebase-config.js')) {
    checks.push({ check: 'Firebase config', passed: true });
  } else {
    checks.push({ check: 'Firebase config', passed: false });
  }

  // Check for FirebaseContentLoader
  if (html.includes('firebase-content-loader.js') || html.includes('FirebaseContentLoader')) {
    checks.push({ check: 'Content loader', passed: true });
  } else {
    checks.push({ check: 'Content loader', passed: false });
  }

  // Check for Firestore
  if (html.includes('firebase-firestore')) {
    checks.push({ check: 'Firestore SDK', passed: true });
  } else {
    checks.push({ check: 'Firestore SDK', passed: false });
  }

  // Check for loading containers
  if (html.includes('loading-container') || html.includes('loading-spinner')) {
    checks.push({ check: 'Loading states', passed: true });
  } else {
    checks.push({ check: 'Loading states', passed: false });
  }

  // Check for content containers
  const contentContainers = [
    'deities-container',
    'heroes-container',
    'creatures-container',
    'cosmology-container'
  ];

  let foundContainers = 0;
  contentContainers.forEach(container => {
    if (html.includes(container)) {
      foundContainers++;
    }
  });

  checks.push({
    check: 'Content containers',
    passed: foundContainers > 0,
    value: `${foundContainers}/${contentContainers.length} found`
  });

  test.details.checks = checks;

  const failedChecks = checks.filter(c => !c.passed);
  if (failedChecks.length === 0) {
    test.status = 'passed';
  } else if (failedChecks.length < checks.length / 2) {
    test.status = 'warning';
    test.details.message = `${failedChecks.length} checks failed`;
  } else {
    test.status = 'failed';
  }

  return test;
}

// Test 4: Check CSS and theme
function testCssAndTheme(page, response) {
  const test = {
    name: `${page.name} - CSS & Theme`,
    status: 'pending',
    details: {}
  };

  if (!response || !response.body) {
    test.status = 'skipped';
    test.details.message = 'No response body to test';
    return test;
  }

  const html = response.body;
  const checks = [];

  // Check for theme CSS
  if (html.includes('theme-base.css') || html.includes('themes/')) {
    checks.push({ check: 'Theme CSS', passed: true });
  } else {
    checks.push({ check: 'Theme CSS', passed: false });
  }

  // Check for Firebase theme CSS
  if (html.includes('firebase-themes.css')) {
    checks.push({ check: 'Firebase themes', passed: true });
  } else {
    checks.push({ check: 'Firebase themes', passed: false });
  }

  // Check for styles.css
  if (html.includes('styles.css')) {
    checks.push({ check: 'Base styles', passed: true });
  } else {
    checks.push({ check: 'Base styles', passed: false });
  }

  // Check for theme picker
  if (html.includes('theme-picker')) {
    checks.push({ check: 'Theme picker', passed: true });
  } else {
    checks.push({ check: 'Theme picker', passed: false });
  }

  // Check for data-theme attribute
  if (page.mythology && html.includes(`data-theme="${page.mythology}"`)) {
    checks.push({ check: 'Theme attribute', passed: true, value: page.mythology });
  } else if (!page.mythology) {
    checks.push({ check: 'Theme attribute', passed: true, value: 'N/A for this page' });
  } else {
    checks.push({ check: 'Theme attribute', passed: false });
  }

  test.details.checks = checks;

  const failedChecks = checks.filter(c => !c.passed);
  if (failedChecks.length === 0) {
    test.status = 'passed';
  } else if (failedChecks.length < checks.length / 2) {
    test.status = 'warning';
  } else {
    test.status = 'failed';
  }

  return test;
}

// Test 5: Check navigation links
function testNavigationLinks(page, response) {
  const test = {
    name: `${page.name} - Navigation Links`,
    status: 'pending',
    details: {}
  };

  if (!response || !response.body) {
    test.status = 'skipped';
    test.details.message = 'No response body to test';
    return test;
  }

  const html = response.body;
  const checks = [];

  // Find all links
  const linkMatches = html.match(/href=["'](.*?)["']/g) || [];
  const links = linkMatches.map(match => {
    const href = match.match(/href=["'](.*?)["']/)[1];
    return href;
  });

  test.details.totalLinks = links.length;

  // Categorize links
  const internalLinks = links.filter(l => !l.startsWith('http') && !l.startsWith('//'));
  const externalLinks = links.filter(l => l.startsWith('http') || l.startsWith('//'));
  const fragmentLinks = links.filter(l => l.startsWith('#'));

  test.details.linkTypes = {
    internal: internalLinks.length,
    external: externalLinks.length,
    fragments: fragmentLinks.length
  };

  // Check for breadcrumb navigation
  if (html.includes('class="breadcrumb"') || html.includes('aria-label="Breadcrumb"')) {
    checks.push({ check: 'Breadcrumb navigation', passed: true });
  } else {
    checks.push({ check: 'Breadcrumb navigation', passed: false });
  }

  // Check for footer links
  if (html.includes('<footer>')) {
    checks.push({ check: 'Footer present', passed: true });
  } else {
    checks.push({ check: 'Footer present', passed: false });
  }

  test.details.checks = checks;
  test.status = 'passed';

  return test;
}

// Test 6: Performance metrics
function testPerformance(page, response) {
  const test = {
    name: `${page.name} - Performance`,
    status: 'pending',
    details: {}
  };

  if (!response) {
    test.status = 'skipped';
    return test;
  }

  test.details.loadTime = response.loadTime;
  test.details.contentSize = response.body ? response.body.length : 0;
  test.details.contentSizeKB = Math.round(test.details.contentSize / 1024);

  // Performance thresholds
  const loadTimeThreshold = 2000; // 2 seconds
  const sizeThreshold = 500 * 1024; // 500KB

  const checks = [];

  if (response.loadTime < loadTimeThreshold) {
    checks.push({
      check: 'Load time acceptable',
      passed: true,
      value: `${response.loadTime}ms < ${loadTimeThreshold}ms`
    });
  } else {
    checks.push({
      check: 'Load time acceptable',
      passed: false,
      value: `${response.loadTime}ms >= ${loadTimeThreshold}ms`
    });
  }

  if (test.details.contentSize < sizeThreshold) {
    checks.push({
      check: 'Page size reasonable',
      passed: true,
      value: `${test.details.contentSizeKB}KB < ${Math.round(sizeThreshold/1024)}KB`
    });
  } else {
    checks.push({
      check: 'Page size reasonable',
      passed: false,
      value: `${test.details.contentSizeKB}KB >= ${Math.round(sizeThreshold/1024)}KB`
    });
  }

  test.details.checks = checks;

  const failedChecks = checks.filter(c => !c.passed);
  if (failedChecks.length === 0) {
    test.status = 'passed';
  } else {
    test.status = 'warning';
  }

  return test;
}

// Run all tests for a page
async function testPage(page) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${page.name}`);
  console.log('='.repeat(60));

  const pageTests = [];

  // Test 1: Page loads
  const { test: loadTest, response } = await testPageLoads(page);
  pageTests.push(loadTest);
  console.log(`✓ Load test: ${loadTest.status}`);

  // Test 2: HTML structure
  const structureTest = testHtmlStructure(page, response);
  pageTests.push(structureTest);
  console.log(`✓ Structure test: ${structureTest.status}`);

  // Test 3: Firebase integration
  const firebaseTest = testFirebaseIntegration(page, response);
  pageTests.push(firebaseTest);
  console.log(`✓ Firebase test: ${firebaseTest.status}`);

  // Test 4: CSS and theme
  const themeTest = testCssAndTheme(page, response);
  pageTests.push(themeTest);
  console.log(`✓ Theme test: ${themeTest.status}`);

  // Test 5: Navigation
  const navTest = testNavigationLinks(page, response);
  pageTests.push(navTest);
  console.log(`✓ Navigation test: ${navTest.status}`);

  // Test 6: Performance
  const perfTest = testPerformance(page, response);
  pageTests.push(perfTest);
  console.log(`✓ Performance test: ${perfTest.status}`);

  return pageTests;
}

// Main test runner
async function runAllTests() {
  console.log('Firebase Website Testing Suite');
  console.log('===============================\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Testing ${pagesToTest.length} pages...\n`);

  for (const page of pagesToTest) {
    const pageTests = await testPage(page);
    testResults.tests.push(...pageTests);

    // Update summary
    pageTests.forEach(test => {
      testResults.summary.total++;

      if (test.status === 'passed') {
        testResults.summary.passed++;
      } else if (test.status === 'failed') {
        testResults.summary.failed++;
      } else if (test.status === 'warning') {
        testResults.summary.warnings++;
      }
    });
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✓`);
  console.log(`Warnings: ${testResults.summary.warnings} ⚠`);
  console.log(`Failed: ${testResults.summary.failed} ✗`);
  console.log(`\nResults saved to: ${RESULTS_FILE}`);

  return testResults;
}

// Run tests
runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
