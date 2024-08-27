const vscode = require('vscode');
const debug = require('./debug');

/**
 * Retrieves current state of extension's config.
 */
function get() {
  return debug.configOverrideEnabled ? debug.configOverride : vscode.workspace.getConfiguration('mql_compiler');
}

/**
 * Retrieves compiler's path for the given platform version.
 * @param {number} platformVersion Version of the platform, e.g., 4 or 5.
 */
function platformExecutablePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.MetaEditor4Path;
    case 5:
      return config.MTE.MetaEditor5Path;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

/**
 * Retrieves Is-Wine-Path for compiler's path for the given platform version.
 * @param {number} platformVersion Version of the platform, e.g., 4 or 5.
 */
function platformExecutablePathIsWinePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.MetaEditor4PathIsWinePath;
    case 5:
      return config.MTE.MetaEditor5PathIsWinePath;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

/**
 * Retrieves compiler's include path for the given platform version.
 * @param {number} platformVersion Version of the platform, e.g., 4 or 5.
 */
function platformIncludePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.IncludePath4;
    case 5:
      return config.MTE.IncludePath5;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

/**
 * Retrieves Is-Wine-Path for compiler's include path for the given platform version.
 * @param {number} platformVersion Version of the platform, e.g., 4 or 5.
 */
function platformIncludePathIsWinePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.IncludePath4IsWinePath;
    case 5:
      return config.MTE.IncludePath5IsWinePath;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

module.exports = {
  get,
  get current() { return get(); },
  platformExecutablePath,
  platformExecutablePathIsWinePath,
  platformIncludePath,
  platformIncludePathIsWinePath,
};
