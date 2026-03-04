/**
 * Windows signed build script using electron-builder's JS API.
 * Merges Azure Trusted Signing options from environment variables
 * with the existing package.json build config.
 *
 * Usage:
 *   node build-win.js [--publish]
 *
 * Required environment variables:
 *   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 *   AZURE_ENDPOINT, AZURE_CODE_SIGNING_ACCOUNT, AZURE_CERT_PROFILE
 *   WIN_PUBLISHER_NAME, GH_TOKEN
 */
const builder = require('electron-builder');

// Validate required environment variables
const required = [
  'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET',
  'AZURE_ENDPOINT', 'AZURE_CODE_SIGNING_ACCOUNT', 'AZURE_CERT_PROFILE',
  'WIN_PUBLISHER_NAME', 'GH_TOKEN'
];
const missing = required.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Azure Trusted Signing Configuration:');
console.log(`  Endpoint:            ${process.env.AZURE_ENDPOINT}`);
console.log(`  Signing Account:     ${process.env.AZURE_CODE_SIGNING_ACCOUNT}`);
console.log(`  Certificate Profile: ${process.env.AZURE_CERT_PROFILE}`);
console.log(`  Publisher Name:      ${process.env.WIN_PUBLISHER_NAME}`);
console.log('');

const publish = process.argv.includes('--publish') ? 'always' : 'never';

builder.build({
  targets: builder.Platform.WINDOWS.createTarget('nsis', builder.Arch.x64),
  publish: publish,
  config: {
    win: {
      azureSignOptions: {
        publisherName: process.env.WIN_PUBLISHER_NAME,
        endpoint: process.env.AZURE_ENDPOINT,
        codeSigningAccountName: process.env.AZURE_CODE_SIGNING_ACCOUNT,
        certificateProfileName: process.env.AZURE_CERT_PROFILE,
      },
    },
  },
}).then(() => {
  console.log('\nWindows build complete!');
}).catch((error) => {
  console.error('\nBuild failed:', error);
  process.exit(1);
});
