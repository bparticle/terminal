const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCANLINES_PFP_DIR = path.resolve(__dirname, '..', '..', '..', 'scanlines', 'packages', 'pfp-generator');
const PACKAGES_DIR = path.resolve(__dirname, '..', 'packages');
const TARGET_FILE = path.join(PACKAGES_DIR, 'scanlines-pfp-generator.tgz');

if (!fs.existsSync(SCANLINES_PFP_DIR)) {
  console.error(`pfp-generator source not found at: ${SCANLINES_PFP_DIR}`);
  console.error('Make sure the scanlines repo is cloned alongside the terminal repo.');
  process.exit(1);
}

console.log(`Building pfp-generator in ${SCANLINES_PFP_DIR}...`);
execSync('npm run build', { cwd: SCANLINES_PFP_DIR, stdio: 'inherit' });

console.log('Packing tarball...');
const packOutput = execSync('npm pack --json', { cwd: SCANLINES_PFP_DIR, encoding: 'utf-8' });
const packInfo = JSON.parse(packOutput);
const tarballName = packInfo[0].filename;
const tarballSource = path.join(SCANLINES_PFP_DIR, tarballName);

if (!fs.existsSync(PACKAGES_DIR)) {
  fs.mkdirSync(PACKAGES_DIR, { recursive: true });
}

fs.copyFileSync(tarballSource, TARGET_FILE);
fs.unlinkSync(tarballSource);

console.log(`Updated ${TARGET_FILE}`);
console.log('Run "npm install" to pick up the new version.');
