const { notarize } = require('@electron/notarize');
const { build } = require('./package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('Notarizing app...');
  
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  try {
    await notarize({
      appPath,
      appBundleId: build.appId,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }

  console.log(`Notarization completed for ${appPath}`);
};
