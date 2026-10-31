/**
 * Verification test for Assistant Page rendering fixes and ErrorBoundary
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===========================================================================');
console.log('TESTING ASSISTANT PAGE IMPORTS AND ERROR RESILIENCE');
console.log('===========================================================================');

const assistantPath = path.resolve(__dirname, '../../../Frontend/src/pages/AssistantPage.jsx');
const content = fs.readFileSync(assistantPath, 'utf8');

// 1. Check ErrorAlert import
assert(
  content.includes("import ErrorAlert from '../components/common/ErrorAlert';"),
  'ErrorAlert must be explicitly imported in AssistantPage.jsx'
);
console.log('✓ Check 1 PASS: ErrorAlert is imported in AssistantPage.jsx');

// 2. Check safe profile access
assert(
  content.includes('profile?.designation') && content.includes('profile?.skills?.length'),
  'Safe optional chaining must be used for profile in AssistantPage.jsx'
);
console.log('✓ Check 2 PASS: Profile optional chaining is present in AssistantPage.jsx');

// 3. Check safe message content mapping
assert(
  content.includes("typeof msg.content === 'string'"),
  'Safe content type checking must be used when rendering chat messages'
);
console.log('✓ Check 3 PASS: Message content safe string extraction is present');

// 4. Check Layout ErrorBoundary
const layoutPath = path.resolve(__dirname, '../../../Frontend/src/components/layout/Layout.jsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
assert(
  layoutContent.includes('ErrorBoundary') && layoutContent.includes('<ErrorBoundary>'),
  'Layout.jsx must wrap routes in ErrorBoundary'
);
console.log('✓ Check 4 PASS: ErrorBoundary is protecting Layout.jsx');

console.log('===========================================================================');
console.log('ALL ASSISTANT FIX CHECKS PASSED');
console.log('===========================================================================');
