const config = require('./config');
const cli = require('./cli');
const wsl = require('./wsl');

/**
 * Checks whether 32-bit wine is installed.
 */
function installed32() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!cli.execCached(wsl.passThroughWslMaybe('which wine'), wsl.wslOptions).toString();

  return false;
}

/**
 * Checks whether 64-bit wine is installed.
 */
function installed64() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!cli.execCached(wsl.passThroughWslMaybe('which wine64'), wsl.wslOptions).toString();

  return false;
}

/**
 * Checks whether wine is installed.
 */
function installed() {
  return installed32() || installed64();
}


/**
 * Returns name of the wine executable for the given MT platform version.
 */
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
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return platformSpecificExecutable(platformVersion) + ' ' + command;

  // On non-Windows platforms we just skip WSL part.
  return command;
}

module.exports = {
  installed32,
  installed64,
  installed,
  platformSpecificExecutable,
  passThroughWineMaybe
}