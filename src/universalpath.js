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
 * - Auto-detection:
 * const path = new UniversalPath('/home/mx/test.mq5');
 *
 * - Overriding OS'es, platforms and WSL mode for testing purposes:
 * const path = new UniversalPath('/home/mx/test.mq5', false, OsType.Unix, OsType.Windows, false);
 */
class UniversalPath {
  /**
   * Constructor.
   */
  constructor(path, isWinePath, osType, platformOverride, isWslOverride) {
    if (path.length == 0)
      osType = OsType.Unknown;
    else {
      if (osType == OsType.Unknown)
        // @todo detecting system.
        osType = this.detectOs(path, isWinePath);

      if (osType == OsType.Unknown)
        throw new Error(`Error: Could not detect OS for path "${path}"!`);
    }

    this.path = osType == OsType.Windows ? paths.backslashize(path) : paths.slashize(path);
    this.isWinePath = isWinePath ?? false;
    this.pathOs = osType ?? OsType.Unknown;
    this.platformOverride = platformOverride ?? OsType.Unknown;
    this.isWslOverride = isWslOverride;
  }

  /**
   * Tries to detect OS for a given path.
   */
  detectOs(path, isWinePath) {
    if (path.length == 0)
      return OsType.Unknown;

    let osType;

    if (isWinePath || path.match(paths.reWindowsDriveLetterPath))
      osType = OsType.Windows;
    else
      if (path.substring(0, 1) == '/')
        osType = OsType.Unix;
      else
        osType = OsType.Unknown;

    return osType;
  }

  /**
   * Checks whether this object has valid parameters.
   */
  isValid() {
    if (this.path.length == 0)
      return true;

    if (this.pathOs == OsType.Unknown)
      return false;

    if (!this.isHostWindows && this.pathOs == OsType.Windows && !this.isWinePath && !this.isWslMode)
      // On Unix, Windows path is only valid for inside-Wine path or under WSL environment.
      return false;

    if (this.path.match(paths.reDosDevices) && this.isHostWindows && !this.isWslMode)
      // This path is invalid. We can't map under-Wine path into path in non-WSL mode on Windows host.
      return false;

    if (this.path.match(paths.reWindowsDriveLetterPath) && !this.isHostWindows && !this.isWslMode && !this.isWinePath)
      // Such path is invalid as we can't map Windows path to Unix host outside the Wine or for non-Wine mode.
      return false;

    return true;
  }

  /**
   * Converts current path into Windows one to be used by Windows host or by wine.
   */
  asCliPath() {
    if (this.path.length == 0)
      // Empty path.
      return '';

    if (this.pathOs == OsType.Unknown)
      // OS should be auto-detected from path given to constructor.
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.isWinePath)
      // Path is already an inside-wine path. Returning as is.
      return this.path;

    // Host path scenario (path outside the wine):

    if (this.pathOs == OsType.Windows) { // pathOs = Windows, isWinePath = false, path = "C:/tmp/test.mq5".
      if (this.isHostWindows) {
        if (this.isWslMode)
          // On Windows-host environment, WSL mode and Windows path we will create path via: wsl.exe winepath -w `wslpath -a PATH`.
          return paths.convertWindowsHostToWinePath(this.path);
        else
          // On Windows-host environment, non-WSL mode and Windows path we don't need to convert anything. Above path will stay as "C:/tmp/test.mq5".
          return this.path;
      }
      else { // if !this.isHostWindows
        // On Unix-host environment, Windows path and non-Wine path we assume that path is a Windows-host path.
        return paths.convertWindowsHostToWinePath(this.path);
      }
    }
    else {
      if (this.pathOs == OsType.Unix) {
        if (!this.isHostWindows || (this.isHostWindows && this.isWslMode))
          // On Unix-host environment or WSL mode and Unix path we will create path via: [wsl.exe] winepath -w PATH.
          return paths.convertUnixPathToWinePath(this.path);
        else // if this.isHostWindows
          if (this.path.match(paths.reUnixMntWindowsLetter))
            // Normally, we can't specify Unix path under Windows with disabled WSL mode.
            // However, we allow such path, so user could leave it when switching between Windows and WSL if he expects Windows-host path.
            return paths.convertUnixMntPathToWindowsPath(this.path);
          else
            // We can't create path in Windows-host environment, non WSL mode and Unix path.
            throw new Error(`Error: Could not convert Windows-host Unix path "${this.path}" to anything considerable. Please provide Windows path or enable WSL mode.`);
      }
      else
        // In Windows-host environment we
        throw new Error(`Error: Not implemented: Convert Windows host path into wine path.`);
    }
  }

  /**
   * Converts current path into target system one. E.g., for VS Code hinting system.
   */
  asTargetPath() {
    if (this.path.length == 0)
      // Empty path.
      return '';

    if (this.pathOs == OsType.Unknown)
      // OS should be auto-detected from path given to constructor.
      throw new Error(`Error: Unsupported path OS type!`);

    if (this.pathOs == OsType.Windows) {
      if (this.isHostWindows) {
        if (!this.isWslMode)
          return this.path;

        if (this.isWslMode && this.isWinePath)
          return paths.convertWineToWindowsPath(this.path);

        if (this.isWslMode && !this.isWinePath)
          return paths.backslashize(this.path);
      }
      else {
        if (this.isWinePath)
          // Converting Windows path into path inside Wine (/home/<user>/.wine/dosdevices/<drive>:/...).
          return paths.convertWinePathToUnixDosDevicesPath(this.path);

        if (this.isWslMode)
          // Converting Windows path into path under /mnt/<letter>/.
          return paths.convertWindowsHostToWslPath(this.path);
        else // if !this.isWslMode
          return paths.convertWineToUnixPath(this.path);
      }
    }
    else
      if (this.pathOs == OsType.Unix) {
        if (this.isHostWindows && !this.isWslMode) {
          if (this.path.match(paths.reUnixMntWindowsLetter))
            // Normally, we can't specify Unix path under Windows with disabled WSL mode.
            // However, we allow such path, so user could leave it when switching between Windows and WSL if he expects Windows-host path.
            return paths.convertUnixMntPathToWindowsPath(this.path);
          else
            throw new Error(`Error: Could not convert Windows-host Unix path "${this.path}" to anything considerable. Please provide Windows path or enable WSL mode.`);
        }
        else
          if (this.isHostWindows && this.isWslMode)
            // Note that when testing we override WSL default distribution name, so tests will check for name "Ubuntu". In WSL or Unix the `wsl -l -q` will be called in order to check distribution name.
            return paths.convertWineToWindowsPath(this.path, this.isWslOverride == undefined && this.platformOverride == undefined ? undefined : 'Ubuntu');
          else // if !this.isHostWindows
            // Having Unix-host and Unix path, we just return the path as it is.
            return this.path;
      }
  }

  /**
   * Creates UniversalPath clone with difference file extension.
   */
  cloneWithExtension(/*extension*/) {
    const fileInfo = paths.getFileInfo(this.path);
    const newPath = this.path.replace(fileInfo.fileName, fileInfo.fileName.match(/.+(?=\.)/) + '.log');
    return new UniversalPath(newPath, this.isWinePath, this.pathOs, this.platformOverride, this.isWslOverride);
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
    if (this.platformOverride !== undefined)
      return this.platformOverride == OsType.Windows;

    return process.platform == 'win32';
  }

  /**
   * Returns true if target app should be ran through WSL.
   */
  get isWslMode() {
    if (this.isWslOverride !== undefined)
      return this.isWslOverride;

    return config.current.MTE.PassThroughWSL;
  }
}

module.exports = {
  OsType,
  UniversalPath,
};
