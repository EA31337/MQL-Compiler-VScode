const childProcess = require('child_process');
const fs = require('fs');
const config = require('./config');
const wsl = require('./wsl');

function windowsSlashedPathOf(path) {
  let result = '';

  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    // Converting unix path to Windows one. If it's already a Windows path then it will be fine.
    result = childProcess.execSync(wsl.passThroughWslMaybe(`winepath -w "${path}"`)).toString().slice(0, -1);
  else
    result = path;

  // Converting backslashes into slashes.
  result = result.replace(/\\/g, '/');

  console.log(`windowsPathOf("${path}") = "${result}"`);

  return result;
}

function targetPlatformPathOf(path) {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return childProcess.execSync(wsl.passThroughWslMaybe(`winepath -u "${path}"`)).toString().slice(0, -1);

  return path;
}

function installed32() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!childProcess.execSync(wsl.passThroughWslMaybe('which wine')).toString();

  return false;
}

function installed64() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!childProcess.execSync(wsl.passThroughWslMaybe('which wine64')).toString();

  return false;
}

function installed() {
  return installed32() || installed64();
}

function platformSpecificExecutable(platformVersion) {
  switch (platformVersion) {
    case 4:
      if (installed32())
        return 'wine';
      else
        throw new Error(`Error: Trying to run 32-bit platform, but there is no 32-bit wine installed!`);
    case 5:
      if (installed64())
        return 'wine64';
      else
        throw new Error(`Error: Trying to run 64-bit platform, but there is no 64-bit wine (wine64) installed!`);
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

/**
 * If called on non-Windows or user ticked "Pass command through WSL (only for Windows platform)." then "wine" or
 * "wine64" will be prepended to the given command.
 * @param {string} command
 */
function passThroughWineMaybe(platformVersion, command) {
  if (config.current.MTE.PassThroughWSL && process.platform == 'win32')
    return platformSpecificExecutable(platformVersion) + ' ' + command;

  // On non-Windows platforms we just skip WSL part.
  return command;
}

module.exports = {
  windowsSlashedPathOf,
  targetPlatformPathOf,
  get installed32() { return installed32() },
  get installed64() { return installed64() },
  get installed() { return installed() },
  platformSpecificExecutable,
  passThroughWineMaybe
};
