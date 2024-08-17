const pathModule = require('path');

/**
 * Converts backslashes to slashes.
 */
function slashize(path) {
  return path.replace(/\\/g, '/');
}

/**
 * Converts Windows-host Windows path into inside-wine path.
 */
function convertWindowsHostToWinePath(windowsPath) {
  // Check if the path starts with a drive letter, e.g., "C:/"
  const driveLetterPattern = /^([a-zA-Z]):(\/|\\)/;

  const match = windowsPath.match(driveLetterPattern);
  if (match) {
    // Extract the drive letter and convert it to lower case
    const driveLetter = match[1].toLowerCase();

    // Remove the drive letter part from the path
    let unixStylePath = windowsPath.replace(driveLetterPattern, '');

    // Replace forward slashes with backslashes
    unixStylePath = unixStylePath.replace(/\//g, '\\');

    // Construct the Wine path by prepending "Z:/mnt/<drive-letter>/"
    return `Z:\\mnt\\${driveLetter}\\${unixStylePath}`;
  }

  // If no drive letter is found, assume it's a relative path and just convert slashes
  return windowsPath.replace(/\//g, '\\');
}

/**
 * Converts WSL or Unix path into inside-wine path.
 */
function convertUnixPathToWinePath(unixPath) {
  // Check if the path starts with "/mnt/<drive-letter>/"
  const mntPattern = /^\/mnt\/([a-zA-Z])\//;

  const match = unixPath.match(mntPattern);
  if (match) {
    // Extract the drive letter and convert it to upper case
    const driveLetter = match[1].toUpperCase();

    // Remove the "/mnt/<drive-letter>/" part from the path
    let winePath = unixPath.replace(mntPattern, '');

    // Replace forward slashes with backslashes
    winePath = winePath.replace(/\//g, '\\');

    // Prepend the drive letter and colon
    return `${driveLetter}:\\${winePath}`;
  }

  // If no "/mnt/<drive-letter>/" pattern is found, just replace forward slashes with backslashes
  return unixPath.replace(/\//g, '\\');
}

function convertWineToUnixPath(winePath) {
  // Check if the path starts with a drive letter, e.g., "C:\"
  const driveLetterPattern = /^([a-zA-Z]):(\\|\/)/;

  const match = winePath.match(driveLetterPattern);

  if (match) {
    // Extract drive letter and convert it to lower case
    const driveLetter = match[1].toLowerCase();

    // Remove the drive letter part from the path
    let unixPath = winePath.replace(driveLetterPattern, '');

    // Replace backslashes with forward slashes
    unixPath = unixPath.replace(/\\/g, '/');

    if (driveLetter.toLowerCase() != 'z')
      // Prepend "/mnt/" followed by the drive letter for the Unix style.
      return `/mnt/${driveLetter}${unixPath}`;

    // Z:/ means root-based unix path.
    return `/${unixPath}`;
  }

  // If there's no drive letter, simply replace backslashes with forward slashes.
  return winePath.replace(/\\/g, '/');
}

function convertWineToWindowsPath(winePath) {
  // Check if the path starts with "Z:/mnt/<drive-letter>/"
  const winePathPattern = /^Z:\\mnt\\([a-zA-Z])\\/;

  const match = winePath.match(winePathPattern);
  if (match) {
    // Extract the drive letter and convert it to upper case
    const driveLetter = match[1].toUpperCase();

    // Remove the "Z:\mnt\<drive-letter>\" part from the path
    let windowsPath = winePath.replace(winePathPattern, '');

    // Replace backslashes with forward slashes
    windowsPath = windowsPath.replace(/\\/g, '/');

    // Prepend the drive letter and colon
    return `${driveLetter}:/${windowsPath}`;
  }

  // If no "Z:/mnt/<drive-letter>/" pattern is found, return the path as is with slashes converted
  return winePath.replace(/\\/g, '/');
}

/**
 * Tries to detect MQL version from the file path given. Returns number, either 4 or 5.
 * @param {string} path
 */
function getFileInfo(path) {
  const fileName = pathModule.basename(path);
  const fileExtension = pathModule.extname(path).toLowerCase();

  return {
    fileName,
    fileExtension
  };
}

module.exports = {
  slashize,
  convertUnixPathToWinePath,
  convertWindowsHostToWinePath,
  convertWineToUnixPath,
  convertWineToWindowsPath,
  getFileInfo
};
