const assert = require('node:assert/strict');

const { OsType, UniversalPath } = require("./universalpath");

class Tests {
    constructor() {
        // We're on Windows and we have Windows path. We don't use WSL.
        this.pathWindowsHostWindowsPathDisabledWSL = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Windows, false);

        // We're on Windows and we have Windows path. WSL mode is enabled.
        this.pathWindowsHostWindowsPathEnabledWSL = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Windows, true);

        // We're on Windows and we have Unix path. We don't use WSL.
        this.pathWindowsHostUnixPathUnderWindowsDisabledWSL = new UniversalPath("/mnt/c/devel/test.mq5", false, undefined, OsType.Windows, false);

        // We're on Windows and we have Unix path. WSL mode is enabled.
        this.pathWindowsHostUnixPathUnderWindowsEnabledWSL = new UniversalPath("/mnt/c/devel/test.mq5", false, undefined, OsType.Windows, true);

        // We're on Windows and we have inside-Wine path. We don't use WSL.
        this.pathWindowsHostUnixPathUnderWineDisabledWSL = new UniversalPath("/home/USER/.wine/dosdevices/c:/devel/test.mq5", false, undefined, OsType.Windows, false);

        // We're on Windows and we have inside-Wine path. WSL mode is enabled.
        this.pathWindowsHostUnixPathUnderWineEnabledWSL = new UniversalPath("/home/USER/.wine/dosdevices/c:/devel/test.mq5", false, undefined, OsType.Windows, true);

        // We're under WSL's Ubuntu and we have Windows' host path.
        this.pathWslWindowsPathInsideWindows = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Unix, true);

        // We're under WSL's Ubuntu and we have inside-Wine path.
        this.pathWslWindowsPathInsideWine = new UniversalPath("C:\\devel\\test.mq5", true, undefined, OsType.Unix, true);

        // We're on Unix (outside WSL) and we have Unix-host path.
        this.pathUnixHostUnixPath = new UniversalPath("/home/devel/test.mq5", false, undefined, OsType.Unix, undefined);

        // We're on Unix (outside WSL) and we have inside-Wine path.
        this.pathUnixHostUnixPathInsideWine = new UniversalPath("C:\\devel\\test.mq5", true, undefined, OsType.Unix, undefined);

        // We're on Unix (outside WSL) and we have Windows path not marked as Wine path [Wrong].
        this.pathUnixHostWindowsPathOutsideWine = new UniversalPath("C:\\devel\\test.mq5", false, undefined, OsType.Unix, undefined);
    }

    runAll() {
        this.pathTest();
    }

    /**
     * Executes UniversalPath and path.js functions' tests in order to check path conversion consistency.
     */
    pathTest() {
        console.log(this);

        // C:\\devel\\test.mq5 [Windows, Windows-style Path, Outside Wine, Non-WSL].
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.isValid(), true);
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.isWslMode, false);
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.asCliPath(), "C:\\devel\\test.mq5");
        assert.strictEqual(this.pathWindowsHostWindowsPathDisabledWSL.asTargetPath(), "C:\\devel\\test.mq5");

        // C:\\devel\\test.mq5 [Windows, Windows-style Path, Outside Wine, Through WSL].
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.isValid(), true);
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.isWslMode, true);
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
        assert.strictEqual(this.pathWindowsHostWindowsPathEnabledWSL.asTargetPath(), "C:\\devel\\test.mq5");

        // /mnt/c/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, Non-WSL].
        // Normally, we can't specify Unix path under Windows with disabled WSL mode.
        // However, we allow such path, so user could leave it when switching between Windows and WSL if he expects Windows-host path.
        // Such path will be converted to C:\devel\test.mq5 for metatrader.exe CLI usage (asCliPath) and for Windows-host read/write purposes (asTargetPath).
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.isValid(), true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.isWslMode, false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.asCliPath(), "C:\\devel\\test.mq5");
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsDisabledWSL.asTargetPath(), "C:\\devel\\test.mq5");

        // /mnt/c/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, Through WSL].
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.isValid(), true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.isWslMode, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWindowsEnabledWSL.asTargetPath(), "/mnt/c/devel/test.mq5");

        // /home/USER/.wine/dosdevices/c:/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, At Wine Folder, Non-WSL].
        // This path is invalid. We can't map under-Wine path into path in non-WSL mode on Windows host.
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineDisabledWSL.isValid(), false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineDisabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineDisabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineDisabledWSL.isWslMode, false);

        // /home/USER/.wine/dosdevices/c:/devel/test.mq5 [Windows, Unix-style Path, Outside Wine, At Wine Folder, Through WSL].
        // Path will be mapped to inside-Wine path for cliPath() and under Wine on Windows-host for asTargetPath().
        // @fixit Note that WSL machine name could be different than "Ubuntu". We need to detect it.
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.isValid(), true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.isHostWindows, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.isWinePath, false);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.isWslMode, true);
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.asCliPath(), "C:\\devel\\test.mq5");
        assert.strictEqual(this.pathWindowsHostUnixPathUnderWineEnabledWSL.asTargetPath(), "\\\\wsl$\\Ubuntu\\home\\USER\\.wine\\dosdevices\\c:\\devel\\test.mq5");

        // C:\\devel\\test.mq5 [WSL(Unix), Windows-style Path, Inside Windows, Through-WSL].
        // Note that we can use Windows path only in Windows-host or WSL mode (WSL mode will be auto-detected).
        // Thus, on Unix, switching on WSL mode will make the path invalid. Marking path as inside-Wine would help with that.
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.isValid(), true);
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.isHostWindows, false);
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.isWinePath, false);
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.isWslMode, true);
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.asCliPath(), "Z:\\mnt\\c\\devel\\test.mq5");
        assert.strictEqual(this.pathWslWindowsPathInsideWindows.asTargetPath(), "/mnt/c/devel/test.mq5");

        // C:\\devel\\test.mq5 [WSL(Unix), Windows-style Path, Inside Wine, Through WSL].
        // Note that in WSL or Unix we can use Windows-host path only in WSL mode (WSL mode will be auto-detected).
        assert.strictEqual(this.pathWslWindowsPathInsideWine.isValid(), true);
        assert.strictEqual(this.pathWslWindowsPathInsideWine.isHostWindows, false);
        assert.strictEqual(this.pathWslWindowsPathInsideWine.isWinePath, true);
        assert.strictEqual(this.pathWslWindowsPathInsideWine.isWslMode, true);
        assert.strictEqual(this.pathWslWindowsPathInsideWine.asCliPath(), "C:\\devel\\test.mq5");
        assert.match(this.pathWslWindowsPathInsideWine.asTargetPath(), /home\/.*?\/\.wine\/dosdevices\/c:\/devel\/test\.mq5/);

        // /home/devel/test.mq5 [Unix, Unix-style Path, Outside Wine, Non-WSL].
        assert.strictEqual(this.pathUnixHostUnixPath.isValid(), true);
        assert.strictEqual(this.pathUnixHostUnixPath.isHostWindows, false);
        assert.strictEqual(this.pathUnixHostUnixPath.isWinePath, false);
        // WSL mode testing is not necessary.
        assert.strictEqual(this.pathUnixHostUnixPath.asCliPath(), "/home/devel/test.mq5");
        assert.strictEqual(this.pathUnixHostUnixPath.asTargetPath(), "/home/devel/test.mq5");

        // C:\\devel\\test.mq5 [Unix, Unix-style Path, Inside Wine, Non-WSL].
        assert.strictEqual(this.pathUnixHostUnixPathInsideWine.isValid(), true);
        assert.strictEqual(this.pathUnixHostUnixPathInsideWine.isHostWindows, false);
        assert.strictEqual(this.pathUnixHostUnixPathInsideWine.isWinePath, true);
        // WSL mode testing is not necessary.
        assert.strictEqual(this.pathUnixHostUnixPathInsideWine.asCliPath(), "C:\\devel\\test.mq5");
        assert.match(this.pathUnixHostUnixPathInsideWine.asTargetPath(), /home\/.*?\/\.wine\/dosdevices\/c:\/devel\/test\.mq5/);

        // C:\\devel\\test.mq5 [Unix, Windows-style Path, Outside Wine, Non-WSL].
        // Such path is invalid as we can't map Windows path to Unix host outside the Wine or for non-Wine mode.
        assert.strictEqual(this.pathUnixHostWindowsPathOutsideWine.isValid(), false);
        assert.strictEqual(this.pathUnixHostWindowsPathOutsideWine.isHostWindows, false);
        assert.strictEqual(this.pathUnixHostWindowsPathOutsideWine.isWinePath, false);
        // WSL mode testing is not necessary.

        // @todo Include tests where Windows paths are slashed and Unix paths are backslashed (it should work in both cases).

        // We're done.
    }
}

function runTests() {
    new Tests().runAll();

    console.log(`Testing done.`);
}

module.exports = {
    runTests
};
