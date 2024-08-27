const pathModule = require('path');

const { execSync } = require('child_process');

/**
 * Converts backslashes to slashes.
 */
function slashize(path) {
  return path.replace(/\\/g, '/');
}

/**
 * Converts slashes to backslashes.
 */
function backslashize(path) {
  return path.replace(/\//g, '\\');
}

const reDosDevices = /^\/home\/([^/]+)\/\.wine\/dosdevices\/([a-z]):\//i;

const reWindowsDriveLetterPath = /^([a-zA-Z]):(\\|\/)/;

const reUnixMntWindowsLetter = /^\/mnt\/([a-zA-Z])\//;

/**
 * Converts Windows path "<letter>:\\..." into Unix path "/mnt/<letter>/...".
 */
function convertWindowsHostToWslPath(windowsPath) {
  return windowsPath.replace(/^([a-zA-Z]):\\/, (match, letter) => {
    return `/mnt/${letter.toLowerCase()}/`;
  }).replace(/\\/g, '/'); // Convert all remaining backslashes to forward slashes.
}

/**
 * Returns currently logged in user.
 */
const getUserName = (() => {
  if (process.platform == 'win32')
    throw new Error(`Calling getWslUserName() is only possible in WSL or Unix.`);

  let cachedUserName = null; // Variable to store the cached username

  return () => {
    if (!cachedUserName) {
      // If no cached result, execute the command to get the WSL username
      cachedUserName = execSync('whoami').toString().trim();
    }
    return cachedUserName;
  };
})();

/**
 * Converts path in format:
 * "<letter>:\foo\bar"
 * into Windows path in format:
 * "/home/<user>/.wine/dosdevices/<letter>:/foo/bar"
 * Where <user> is the currently logged in user.
*/
function convertWinePathToUnixDosDevicesPath(windowsPath) {
  const userName = getUserName();

  return windowsPath.replace(/^([a-zA-Z]):\\/, (match, letter) => {
    return `/home/${userName}/.wine/dosdevices/${letter.toLowerCase()}:/`;
  }).replace(/\\/g, '/'); // Convert all remaining backslashes to forward slashes
}

/**
 * Retrieves current WSL linux distribution name. Only possible in WSL or Unix.
 */
const getWslMachineName = (() => {
  if (process.platform == 'win32')
    throw new Error(`Calling getWslMachineName() is only possible in WSL or Unix.`);

  let cachedName = null; // Variable to store the cached result.

  return () => {
    if (!cachedName) {
      // If no cached result, run the command to get the WSL machine name.
      const wslOutput = execSync('wsl -l -q').toString().trim();
      cachedName = wslOutput.split('\n')[0]; // Cache the first line (default WSL distribution).
    }
    return cachedName;
  };
})();

/**
 * Converts path in format:
 * "/home/<user>/.wine/dosdevices/<letter>:/foo/bar"
 * into Windows path in format:
 * "\\wsl$\<wsl-machine-name>\home\<user>\.wine\dosdevices\<letter>:\foo\bar"
 */
function convertUnixDosDevicesPathIntoWindowsWSLPath(unixPath, wslMachineNameOverride) {
  const wslMachineName = wslMachineNameOverride ?? getWslMachineName();

  // Replace the Unix-style path with the appropriate Windows-style path
  return unixPath.replace(reDosDevices, (match, user, letter) => {
    return `\\\\wsl$\\${wslMachineName}\\home\\${user}\\.wine\\dosdevices\\${letter.toLowerCase()}:\\`;
  }).replace(/\//g, '\\'); // Convert all remaining slashes to backslashes
}

/**
 * Converts Unix path "/mnt/<letter>/..." into Windows path "<letter>:\\...".
 */
function convertUnixMntPathToWindowsPath(unixPath) {
  // Use a regular expression to match and capture the letter after "/mnt/"
  return unixPath.replace(/^\/mnt\/([a-zA-Z])\//i, (match, letter) => {
    return letter.toUpperCase() + ':\\';
  }).replace(/\//g, '\\'); // Replace all remaining forward slashes with backslashes
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
  let mntPattern = /^\/mnt\/([a-zA-Z])\//;

  // Check if the path starts with "/mnt/<drive-letter>/".
  let match = unixPath.match(mntPattern);

  let winePath;

  if (match) {
    // Extract the drive letter and convert it to upper case.
    const driveLetter = match[1].toLowerCase();

    // Remove the "/mnt/<drive-letter>/" part from the path.
    winePath = unixPath.replace(mntPattern, '');

    // Replace backslashes with forward slashes.
    winePath = slashize(winePath);

    // Prepend the drive letter and colon
    winePath = `Z:/mnt/${driveLetter}/${winePath}`;

    // Back-slashizing for Windows.
    return backslashize(winePath);
  }

  mntPattern = /^\/home\/.*?\/.wine\/dosdevices\/([a-zA-Z]):\//;

  // Check if the path starts with "/home/<user>/.wine/dosdevices/<drive-letter>:/".
  match = unixPath.match(mntPattern);

  if (match) {
    // Extract the drive letter and convert it to upper case.
    const driveLetter = match[1].toUpperCase();

    // Removing starting string from from the path.
    winePath = unixPath.replace(mntPattern, '');

    // Replace backslashes with forward slashes.
    winePath = slashize(winePath);

    winePath = `${driveLetter}:/${winePath}`;

    // Back-slashizing for Windows.
    return backslashize(winePath);
  }

  return slashize(unixPath);
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
    unixPath = slashize(unixPath);

    if (driveLetter.toLowerCase() != 'z')
      // Prepend "/mnt/" followed by the drive letter for the Unix style.
      return `/mnt/${driveLetter}/${unixPath}`;

    // Z:/ means root-based unix path.
    return `/${unixPath}`;
  }

  // If there's no drive letter, simply replace backslashes with forward slashes.
  return winePath.replace(/\\/g, '/');
}

function convertWineToWindowsPath(winePath, wslMachineNameOverride) {
  // Check if the path starts with "Z:\mnt\<drive-letter>\"
  const winePathPattern = /^Z:\\mnt\\([a-zA-Z])\\/;

  let match = winePath.match(winePathPattern);

  if (match) {
    // Extract the drive letter and convert it to upper case
    const driveLetter = match[1].toUpperCase();

    // Remove the "Z:\mnt\<drive-letter>\" part from the path
    let windowsPath = winePath.replace(winePathPattern, '');

    // Replace backslashes with forward slashes
    windowsPath = slashize(windowsPath);

    // Prepend the drive letter and colon
    windowsPath = `${driveLetter}:\\${windowsPath}`;

    // Back-slashizing for Windows.
    return backslashize(windowsPath);
  }

  match = winePath.match(reDosDevices);

  if (match) {
    winePath = convertUnixDosDevicesPathIntoWindowsWSLPath(winePath, wslMachineNameOverride);
    return winePath;
  }

  // If no "Z:/mnt/<drive-letter>/" pattern is found, return the path as is with slashes converted.
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
  reDosDevices,
  reWindowsDriveLetterPath,
  reUnixMntWindowsLetter,
  slashize,
  backslashize,
  getWslMachineName,
  convertWinePathToUnixDosDevicesPath,
  convertWindowsHostToWslPath,
  convertUnixDosDevicesPathIntoWindowsWSLPath,
  convertUnixMntPathToWindowsPath,
  convertUnixPathToWinePath,
  convertWindowsHostToWinePath,
  convertWineToUnixPath,
  convertWineToWindowsPath,
  getFileInfo
};
