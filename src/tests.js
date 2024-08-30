const assert = require('node:assert/strict');
const { OsType, UniversalPath } = require("./universalpath");
const { describe, it } = require('mocha');

// We're on Windows and we have Windows path. We don't use WSL.
const windowsHostWindowsPathDisabledWSL = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Windows, false);

// We're on Windows and we have Windows path. WSL mode is enabled.
const windowsHostWindowsPathEnabledWSL = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Windows, true);

// We're on Windows and we have Unix path. We don't use WSL.
const windowsHostUnixPathUnderWindowsDisabledWSL = new UniversalPath("/mnt/c/devel/test.mq5", false, undefined, OsType.Windows, false);

// We're on Windows and we have Unix path. WSL mode is enabled.
const windowsHostUnixPathUnderWindowsEnabledWSL = new UniversalPath("/mnt/c/devel/test.mq5", false, undefined, OsType.Windows, true);

// We're on Windows and we have inside-Wine path. We don't use WSL.
const windowsHostUnixPathUnderWineDisabledWSL = new UniversalPath("/home/USER/.wine/dosdevices/c:/devel/test.mq5", false, undefined, OsType.Windows, false);

// We're on Windows and we have inside-Wine path. WSL mode is enabled.
const windowsHostUnixPathUnderWineEnabledWSL = new UniversalPath("/home/USER/.wine/dosdevices/c:/devel/test.mq5", false, undefined, OsType.Windows, true);

// We're under WSL's Ubuntu and we have Windows' host path.
const wslWindowsPathInsideWindows = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Unix, true);

// We're under WSL's Ubuntu and we have inside-Wine path.
const wslWindowsPathInsideWine = new UniversalPath("C:\\devel\\test.mq5", true, undefined, OsType.Unix, true);

// We're on Unix (outside WSL) and we have Unix-host path.
const unixHostUnixPath = new UniversalPath("/home/devel/test.mq5", false, undefined, OsType.Unix, undefined);

// We're on Unix (outside WSL) and we have inside-Wine path.
const unixHostUnixPathInsideWine = new UniversalPath("C:\\devel\\test.mq5", true, undefined, OsType.Unix, undefined);

// We're on Unix (outside WSL) and we have Windows path not marked as Wine path [Wrong].
const unixHostWindowsPathOutsideWine = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Unix, undefined);

describe('UniversalPath path manipulation between platforms', function () {
  it('C:\\devel\\test.mq5 [Windows, Windows-style Path, Outside Wine, Non-WSL]', function () {
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.isValid(), true);
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.isWslMode, false);
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.asCliPath(), "C:\\devel\\test.mq5");
    assert.strictEqual(windowsHostWindowsPathDisabledWSL.asTargetPath(), "C:\\devel\\test.mq5");
  });

  it('C:\\devel\\test.mq5 [Windows, Windows-style Path, Outside Wine, Through WSL]', function () {
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.isValid(), true);
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.isWslMode, true);
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
    assert.strictEqual(windowsHostWindowsPathEnabledWSL.asTargetPath(), "C:\\devel\\test.mq5");
  });

  // Normally, we can't specify Unix path under Windows with disabled WSL mode.
  // However, we allow such path, so user could leave it when switching between Windows and WSL if he expects Windows-host path.
  // Such path will be converted to C:\devel\test.mq5 for metatrader.exe CLI usage (asCliPath) and for Windows-host read/write purposes (asTargetPath).
  it('/mnt/c/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, Non-WSL]', function () {
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.isValid(), true);
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.isWslMode, false);
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.asCliPath(), "C:\\devel\\test.mq5");
    assert.strictEqual(windowsHostUnixPathUnderWindowsDisabledWSL.asTargetPath(), "C:\\devel\\test.mq5");
  });

  it('/mnt/c/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, Through WSL]', function () {
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.isValid(), true);
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.isWslMode, true);
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
    assert.strictEqual(windowsHostUnixPathUnderWindowsEnabledWSL.asTargetPath(), "/mnt/c/devel/test.mq5");
  });

  // This path is invalid. We can't map under-Wine path into path in non-WSL mode on Windows host.
  it('/home/USER/.wine/dosdevices/c:/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, At Wine Folder, Non-WSL]', function () {
    assert.strictEqual(windowsHostUnixPathUnderWineDisabledWSL.isValid(), false);
    assert.strictEqual(windowsHostUnixPathUnderWineDisabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostUnixPathUnderWineDisabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostUnixPathUnderWineDisabledWSL.isWslMode, false);
  });

  // Path will be mapped to inside-Wine path for cliPath() and under Wine on Windows-host for asTargetPath().
  // @fixit Note that WSL machine name could be different than "Ubuntu". We need to detect it.
  it('/home/USER/.wine/dosdevices/c:/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, At Wine Folder, Through WSL]', function () {
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.isValid(), true);
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.isHostWindows, true);
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.isWinePath, false);
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.isWslMode, true);
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.asCliPath(), "C:\\devel\\test.mq5");
    assert.strictEqual(windowsHostUnixPathUnderWineEnabledWSL.asTargetPath(), "\\\\wsl$\\Ubuntu\\home\\USER\\.wine\\dosdevices\\c:\\devel\\test.mq5");
  });

  // Note that we can use Windows path only in Windows-host or WSL mode (WSL mode will be auto-detected).
  // Thus, on Unix, switching on WSL mode will make the path invalid. Marking path as inside-Wine would help with that.
  it('C:\\devel\\test.mq5 [WSL(Unix), Windows-style Path, Inside Windows, Through-WSL]', function () {
    assert.strictEqual(wslWindowsPathInsideWindows.isValid(), true);
    assert.strictEqual(wslWindowsPathInsideWindows.isHostWindows, false);
    assert.strictEqual(wslWindowsPathInsideWindows.isWinePath, false);
    assert.strictEqual(wslWindowsPathInsideWindows.isWslMode, true);
    assert.strictEqual(wslWindowsPathInsideWindows.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
    assert.strictEqual(wslWindowsPathInsideWindows.asTargetPath(), "/mnt/c/devel/test.mq5");
  });

  // Note that in WSL or Unix we can use Windows-host path only in WSL mode (WSL mode will be auto-detected).
  it('C:\\devel\\test.mq5 [WSL(Unix), Windows-style Path, Inside Wine, Through WSL]', function () {
    assert.strictEqual(wslWindowsPathInsideWine.isValid(), true);
    assert.strictEqual(wslWindowsPathInsideWine.isHostWindows, false);
    assert.strictEqual(wslWindowsPathInsideWine.isWinePath, true);
    assert.strictEqual(wslWindowsPathInsideWine.isWslMode, true);
    assert.strictEqual(wslWindowsPathInsideWine.asCliPath(), "C:\\devel\\test.mq5");
    assert.match(wslWindowsPathInsideWine.asTargetPath(), /home\/.*?\/\.wine\/dosdevices\/c:\/devel\/test\.mq5/);
  });

  it('/home/devel/test.mq5 [Unix, Unix-style Path, Outside Wine, Non-WSL]', function () {
    assert.strictEqual(unixHostUnixPath.isValid(), true);
    assert.strictEqual(unixHostUnixPath.isHostWindows, false);
    assert.strictEqual(unixHostUnixPath.isWinePath, false);
    // WSL mode testing is not necessary.
    assert.strictEqual(unixHostUnixPath.asCliPath(), "/home/devel/test.mq5");
    assert.strictEqual(unixHostUnixPath.asTargetPath(), "/home/devel/test.mq5");
  });

  it('C:\\devel\\test.mq5 [Unix, Unix-style Path, Inside Wine, Non-WSL]', function () {
    assert.strictEqual(unixHostUnixPathInsideWine.isValid(), true);
    assert.strictEqual(unixHostUnixPathInsideWine.isHostWindows, false);
    assert.strictEqual(unixHostUnixPathInsideWine.isWinePath, true);
    // WSL mode testing is not necessary.
    assert.strictEqual(unixHostUnixPathInsideWine.asCliPath(), "C:\\devel\\test.mq5");
    assert.match(unixHostUnixPathInsideWine.asTargetPath(), /home\/.*?\/\.wine\/dosdevices\/c:\/devel\/test\.mq5/);
  });

  // Such path is invalid as we can't map Windows path to Unix host outside the Wine or for non-Wine mode.
  it('C:\\devel\\test.mq5 [Unix, Windows-style Path, Outside Wine, Non-WSL]', function () {
    assert.strictEqual(unixHostWindowsPathOutsideWine.isValid(), false);
    assert.strictEqual(unixHostWindowsPathOutsideWine.isHostWindows, false);
    assert.strictEqual(unixHostWindowsPathOutsideWine.isWinePath, false);
    // WSL mode testing is not necessary.
  });

  // @todo Include tests where Windows paths are slashed and Unix paths are backslashed (it should work in both cases).

  // We're done.
});
