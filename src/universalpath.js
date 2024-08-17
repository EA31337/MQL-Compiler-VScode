const config = require('./config');
const paths = require('./paths');

/**
 * Path operating system. Used by UniversalPath class.
 */
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
      if (isWinePath || path.match(/^([a-zA-Z]:(\/|\\)|\\\\)/))
        osType = OsType.Windows;
      else
        if (path.substring(0, 1) == '/')
          osType = OsType.Unix;
        else
          osType = OsType.Unknown;
    }

    if (osType == OsType.Unknown)
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
      // OS should be auto-detected from path given to constructor.
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
        if (this.isHostWindows && this.isWslMode) {
          // On Windows-host environment, WSL mode and Windows path we will create path via: wsl.exe winepath -w `wslpath -a PATH`.
          return paths.convertWindowsHostToWinePath(this.path);
        }
        else // if !this.isHostWindows
          // On Unix-host environment and Windows path we assume that path in an inside-wine path.
          return this.path;
    }
    else
      if (this.pathOs == OsType.Unix) {
        if (!this.isHostWindows || (this.isHostWindows && this.isWslMode))
          // On Unix-host environment or WSL mode and Unix path we will create path via: [wsl.exe] winepath -w PATH.
          return paths.convertUnixPathToWinePath(this.path);
        else // if this.isHostWindows
          // We can't create path in Windows-host environment, non WSL mode and Unix path.
          throw new Error(`Error: Could not convert Windows-host Unix path "${this.path}" to anything considerable. Please provide Windows path or enable WSL mode.`);
      }
      else
        // In Windows-host environment we
        throw new Error(`Error: Not implemented: Convert Windows host path into wine path.`);
  }

  /**
   * Converts current path into target system one. E.g., for VS Code hinting system.
   */
  asTargetPath() {
    if (this.pathOs == OsType.Unknown)
      // OS should be auto-detected from path given to constructor.
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.pathOs == OsType.Windows) {
      if (this.isHostWindows && !this.isWslMode)
        return this.path;
      else
        if (this.isHostWindows && this.isWslMode)
          return paths.convertWineToWindowsPath(this.path);
        else // if !this.isHostWindows
          // Having Unix-host and Windows path, we assume that the path is an inside-wine path. We have to convert it via: winepath -u PATH.
          return paths.convertWineToUnixPath(this.path);
    }
    else
      if (this.pathOs == OsType.Unix) {
        if (this.isHostWindows && !this.isWslMode)
          throw new Error(`Error: Could not convert Windows-host Unix path "${this.path}" to anything considerable. Please provide Windows path or enable WSL mode.`);
        else
          if (this.isHostWindows && this.isWslMode)
            return paths.convertWineToWindowsPath(this.path);
          else // if !this.isHostWindows
            // Having Unix-host and Unix path, we just return the path as it is.
            return this.path;
      }
  }

  /**
   * Creates UniversalPath clone with difference file extension.
   */
  cloneWithExtension(extension) {
    const fileInfo = paths.getFileInfo(this.path);
    const newPath = this.path.replace(fileInfo.fileName, fileInfo.fileName.match(/.+(?=\.)/) + '.log');
    return new UniversalPath(newPath, this.isWinePath, this.pathOs);
  }

  /**
   * Creates string representation from this object.
   */
  toString() {
    return (this.isWslMode ? '[WSL-Mode] ' : '') +
      `[${this.pathOs}-path] ` +
      (this.isHostWindows ? '[Windows-host] ' : '[Unix-host] ') +
      (this.isWinePath ? '[Inside-Wine] ' : '[Outside-Wine] ') +
      `"${this.path}" (asCliPath() = "${this.asCliPath()}", asTargetPath() = "${this.asTargetPath()}")`;
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
}

module.exports = {
  OsType,
  UniversalPath,
};
