const vscode = require('vscode');
const fs = require('fs');
const pathModule = require('path');
const config = require('./config');

/**
 * Returns URI for the given path. Path could be either relative to the include path or current file's folder.
 * @param {string} path Path relative to include path or current file's folder.
 */
function getUri(path, platformVersion) {
  // Trying in the local folder.
  const localUri = vscode.window.activeTextEditor.document.uri;
  const localFolder = pathModule.dirname(localUri.fsPath);
  const localPath = pathModule.join(localFolder, path);

  if (fs.existsSync(localPath))
    return localPath;

  const includePaths = getPaths(platformVersion);

  console.log(`Include paths:`, includePaths);

  // Trying in the MQL include path and C/C++ include folders.
  for (let includePath of includePaths) {
    const insideIncludePath = pathModule.join(includePath, path);

    console.log(`Trying "${insideIncludePath}"`);

    if (fs.existsSync(insideIncludePath))
      return insideIncludePath;
  }

  return path;
}

/**
 * Tries to detect MQL version from the file path given. Returns number, either 4 or 5.
 * @param {string} path
 */
function getInfo(path) {
  const fileName = pathModule.basename(path);
  const fileExtension = pathModule.extname(path).toLowerCase();

  return {
    fileName,
    fileExtension
  };
}

/**
 * Tries to detect plaform version required to compile given file.
 * @returns E.g., 4, 5 or 0 in case of failure.
 */
function detectPlatformVersion(path) {
  const pathInfo = getInfo(path);
  // For .mqh files we need to detect whether we're working in MQL4 or MQL5 mode.
  const platformDetectedMQL4 = vscode.workspace.name?.includes('MQL4');
  const usePlatform4 = pathInfo.fileExtension === '.mq4' || pathInfo.fileExtension === '.mqh' && platformDetectedMQL4;
  const usePlatform5 = pathInfo.fileExtension === '.mq5' || pathInfo.fileExtension === '.mqh' && !platformDetectedMQL4;

  if (usePlatform5)
    return 5;

  if (usePlatform4)
    return 4;

  // Cannot identify platform version.
  vscode.window.showWarningMessage(`Error: Unsupported file format "${pathInfo.fileExtension}"!`);

  return 0;
}

/**
 * Returns include MQL and C/C++ include paths.
 */
function getPaths(platformVersion) {
  const cppConfig = vscode.workspace.getConfiguration('C_Cpp');

  const paths = cppConfig.get('default.includePath') || [];

  const platformIncludePath = config.platformIncludePath(platformVersion);

  if (!paths.includes(platformIncludePath))
    paths.push(platformIncludePath);

  return paths;
}

/**
 * Changes include path for C/C++ extension.
 * @fixit Should use local settings file if possible.
 */
function setPath(newPath) {
  setGlobalPath(newPath);
}

/**
 * Changes global include path for C/C++ extension.
 */
const setGlobalPath = async (newPath) => {
  const cppConfig = vscode.workspace.getConfiguration('C_Cpp');

  console.log(`Current cppConfig`, cppConfig);

  let existingIncludePath = cppConfig.get('default.includePath') || [];

  if (!existingIncludePath.includes(newPath)) {
    existingIncludePath.push(newPath);
  }

  await cppConfig.update('default.includePath', existingIncludePath);
};

module.exports = {
  setPath,
  getUri,
  getInfo,
  detectPlatformVersion,
  getPaths
};
