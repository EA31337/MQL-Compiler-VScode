const childProcess = require('child_process');
const fs = require('fs');
const config = require('./config');
const wsl = require('./wsl');

function convertWindowsHostToWinePath(path) {
}

function convertWineToUnixPath(path) {
}


function windowsSlashedPathOf(path) {
  let result = '';

  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    // Converting unix path to Windows one. If it's already a Windows path then it will be fine.
    result = wsl.execCached(wsl.passThroughWslMaybe(`winepath -w "${path}"`)).toString().slice(0, -1);
  else
    result = path;

  // Converting backslashes into slashes.
  result = result.replace(/\\/g, '/');

  console.log(`windowsPathOf("${path}") = "${result}"`);

  return result;
}

function targetPlatformPathOf(path) {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return wsl.execCached(wsl.passThroughWslMaybe(`winepath -u "${path}"`)).toString().slice(0, -1);

  return path;
}

function installed32() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!wsl.execCached(wsl.passThroughWslMaybe('which wine')).toString();

  return false;
}

function installed64() {
  if (process.platform != 'win32' || config.current.MTE.PassThroughWSL)
    return !!wsl.execCached(wsl.passThroughWslMaybe('which wine64')).toString();

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

const OsType = {
  Windows: 'Windows',
  Unix: 'Unix',
  Unknown: undefined
};

/**
 * Usage:
 *
 * const path = new UniversalPath('/home/mx/test.mq5', OSTypes.Unix, true);
 *
 * Scenarios:
 *
 * 1. Windows. Not using WSL. Given Windows-host path, e.g., "C:/tmp/test.mq5":
 *
 * asWinePath() = undefined
 * asUnixPath() = undefined
 * asTargetPath() = "C:/tmp/test.mq5"
 * asCliPath() = "C:/tmp/test.mq5"
 *
 * 2. Windows. Using WSL. Given Windows-host path, e.g., "C:/tmp/test.mq5":
 *
 * asWinePath() = "Z:/mnt/c/tmp/test.mq5"
 * asUnixPath() = "/mnt/c/tmp/test.mq5"
 * asTargetPath() = same as asUnixPath()
 * asCliPath() = same as asWinePath()
 *
 * 3. Windows. Using WSL. Given wine path, e.g., "C:/Program Files/MetaTrader 5/MQL5/test.mq5":
 *
 * asWinePath() = "C:/Program Files/MetaTrader 5/MQL5/test.mq5"
 * asUnixPath() = "/home/.../.wine/dosdevices/C:/Program Files/MetaTrader 5/MQL5/test.mq5" (winepath -u "C:/Program Files/MetaTrader 5/MQL5/test.mq5")
 * asTargetPath() = same as asUnixPath()
 * asCliPath() = same as asWinePath()
 *
 * 4. Windows. Using WSL. Given unix path, e.g., "/tmp/test.mq5":
 *
 * asWinePath() = "Z:/tmp/test.mq5"
 * asUnixPath() = "/tmp/test.mq5"
 * asTargetPath() = same as asUnixPath()
 * asCliPath() = same as asWinePath()
 *
 * 5. Unix. Given unix path, e.g., "/tmp/test.mq5":
 *
 * Same as 4.
 *
 * 6. Unix. Given wine path, e.g., "C:/Program Files/MetaTrader 5/MQL5/test.mq5":
 *
 * Same as 3.
 *
 */
class UniversalPath {
  constructor(path, isWinePath, osType) {
    if (osType == OsType.Unknown) {
      // @todo detecting system.
      if (isWinePath || path.match(/^[A-Z]:(\/|\\)/))
        osType = OsType.Windows;
      else
      if (path.substring(0, 1) == '/')
        osType = OsType.Unix;
      else
        osType = OsType.Unknown;
    }

    if (osType)
      throw new Error(`Error: Could not detect OS for path "${path}"!`);

    this.path = path;
    this.isWinePath = isWinePath;
    this.pathOs = osType;
  }

  /**
   * Converts current path into Windows one to be used by Windows host or by wine.
   */
  asCliPath() {
    if (this.pathOs == OsType.Unknown)
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.isWinePath)
      // Path is already an inside-wine path. Returning as is.
      return this.path;

    // Host path scenario (path outside the wine):

    if (this.pathOs == OsType.Windows) { // pathOs = Windows, isWinePath = false, path = "C:/tmp/test.mq5".
      if (this.isHostWindows && !this.isWslMode)
        // On Windows-host environment, non-WSL mode and Windows path we don't need to convert anything. Above path will stay as "C:/tmp/test.mq5".
        return this.path;
      else
      if (this.isHostWindows && this.isWslMode)
        // On Windows-host environment, WSL mode and Windows path we will create path
        ; // @fixit
      else
        // Unix-host environment doesn't support Windows, non-wine paths.
        throw new Error(`Error: Could not convert Windows-host path "${this.path}" into wine path under Unix system. Please provide inside-wine Windows path.`);
    }
    else
    if (this.pathOs == OsType.Unix) {
      if (this.isHostWindows)
        // Unix-host environment doesn't support Windows, non-wine paths.
        throw new Error(`Error: Could not convert Windows-host path "${this.path}" into wine path under Unix system. Please provide inside-wine Windows path.`);
      else
        // On Unix-host environment and Unix path we don't need to convert anything.
        return this.path;

      // In Unix or WSL environment, the wine path will be created from Unix path via `wine -w ${this.path}`.
      return convertUnixToWinePath(this.path);
    }
    else
      // In Windows-host environment we
      throw new Error(`Error: Not implemented: Convert Windows host path into wine path.`);
  }

  /**
   * Converts current path into unix one.
   */
  asUnixPath() {
    if (this.pathOs == OsType.Unknown)
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.pathOs == OsType.Unix)
      return this.path;

    /*
    if (this.isHostWindows) {
        if (this.isWinePath)
    }
    */
  }

  /**
   * Returns true if extension is running on Windows host.
   */
  get isHostWindows() {
    return process.platform == 'win32';
  }

  /**
   * Returns true if target app should be ran through WSL.
   */
  get isWslMode() {
    return config.current.MTE.PassThroughWSL;
  }

  /**
   * Converts current path into target OS one. For WSL mode it will be unix.
   */
  asTargetPath() {
    if (this.pathOs == OsType.Unknown)
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.isHostWindows) {
      if (this.isWslMode)
        // Windows host, through WSL. Target path is an unix path.
        return this.asUnixPath();

      // if (this.)

      if (this.pathOs == OsType.Windows)
          return this.path;
      else
      if (this.pathOs == OsType.Unix)
        throw new Error(`Error: Could not convert unix path "${this.path}" into Windows one!`);
    }
    else {
      // Unix host.
      if (this.pathOs == OsType.Windows)
          return this.asCliPath();
      else
      if (this.pathOs == OsType.Unix)
        throw new Error(`Error: Could not convert unix path "${this.path}" into Windows one!`);
    }
  }
}

module.exports = {
  UniversalPath,
  OsTypes: OsType,
  windowsSlashedPathOf,
  targetPlatformPathOf,
  get installed32() { return installed32() },
  get installed64() { return installed64() },
  get installed() { return installed() },
  platformSpecificExecutable,
  passThroughWineMaybe
};
