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
 * @param {string} newPath
 */
function setPath(newPath) {
  // @fixit. We'd like to use .vscode/c_cpp_properties.json file and create it if necessary.
  const forceGlobalConfig = true;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || forceGlobalConfig) {
    setGlobalPath(newPath);
    return;
  }

  const cppPropertiesPath = pathModule.join(workspaceFolders[0].uri.fsPath, '.vscode', 'c_cpp_properties.json');

  try {
    // Read the existing c_cpp_properties.json file.
    const data = fs.readFileSync(cppPropertiesPath, 'utf8');
    const config = JSON.parse(data);

    // Ensure the configurations array exists.
    if (!Array.isArray(config.configurations)) {
      config.configurations = [];
    }

    // Add the new include path to each configuration.
    for (const configuration of config.configurations) {
      if (!Array.isArray(configuration.includePath)) {
        configuration.includePath = [];
      }

      if (!configuration.includePath.includes(newPath)) {
        configuration.includePath.push(newPath);
      }
    }

    // Write the updated configuration back to c_cpp_properties.json.
    fs.writeFileSync(cppPropertiesPath, JSON.stringify(config, null, 4), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      vscode.window.showErrorMessage(`c_cpp_properties.json not found while trying to update C/C++ extension's include path.`);
    } else {
      vscode.window.showErrorMessage(`Failed to update C/C++ extension's include path.`);
      console.error(err);
    }
  }
}

const setGlobalPath = async (newPath) => {
  const cppConfig = vscode.workspace.getConfiguration('C_Cpp');
  let existingIncludePath = cppConfig.get('default.includePath') || [];

  if (!existingIncludePath.includes(newPath)) {
    existingIncludePath.push(newPath);
    await cppConfig.update('default.includePath', existingIncludePath, vscode.ConfigurationTarget.Global);
  }
};

module.exports = {
  setPath,
  getUri,
  getInfo,
  detectPlatformVersion,
  getPaths
};
