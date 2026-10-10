'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { runTests } = require('@vscode/test-electron');

const root = path.resolve(__dirname, '..');
const macExecutable = process.platform === 'darwin' ? ['Code', 'Electron']
  .map(name => `/Applications/Visual Studio Code.app/Contents/MacOS/${name}`)
  .find(file => fs.existsSync(file)) : undefined;
const executable = process.env.VSCODE_EXECUTABLE || macExecutable;

runTests({
  extensionDevelopmentPath: root,
  extensionTestsPath: path.join(root, 'test/integration/index.js'),
  ...(executable ? { vscodeExecutablePath: executable } : {}),
  launchArgs: [
    path.join(root, 'test/fixtures'),
    '--user-data-dir', path.join(root, 'work/vscode-test-profile'),
    '--extensions-dir', path.join(root, 'work/vscode-test-extensions'),
    '--disable-extensions',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
  ],
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
