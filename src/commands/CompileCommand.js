const vscode = require('vscode');

const pathModule = require('path');

// MQL file include helpers.
const includes = require('../includes');

// Debug system and overridable configuration.
const debug = require('../debug');

// Extension configuration.
const config = require('../config');

// Console output.
const output = require('../output');

// Workspace helpers.
const workspace = require('../workspace');

// Executing .exe and wine processes.
const childProcess = require('child_process');

// Wine-related helpers.
const wine = require('../wine');

// WSL-related helpers.
const wsl = require('../wsl');

// Windows/Unix/Wine path-related helpers.
const paths = require('../paths');
const { UniversalPath } = require('../universalpath');

// Native file-system.
const fs = require('fs');

// Logging and VS Code warning/error/hint bubbles.
const log = require('../log');
const mtlog = require('../mtlog');
const diagnostics = require('../diagnostics');

/**
 * Checks syntax or compiles MQL file.
 *
 * @param {boolean} mode 0 - Check syntax, 1 - Compile.
 */
async function CompileCommand(mode) {

  if (!wine.installed) {
  }

  const currentConfig = config.get();

  console.log(debug.extensionDebugModeEnabled ? "Starting in debug mode..." : "Starting in release mode...");
  console.log(debug.configOverrideEnabled ? "[Notice] Config override is enabled. This will probably change MT folders." : "Config override is disabled.");

  output.appendLine(`Compiling...`);

  // Saving current file before checking/compiling.
  vscode.commands.executeCommand('workbench.action.files.saveAll');

  const filePath = vscode.window.activeTextEditor.document.fileName;

  output.appendLine(`Compiling file ${filePath}...`);

  const fileInfo = paths.getFileInfo(filePath);
  const platformVersion = includes.detectPlatformVersion(filePath);

  console.log(`Detected platform version ${platformVersion} for file "${filePath}".`);

  console.log(`Extension configuration`, currentConfig);

  // Setting include path for C/C++ extension.
  if (config.platformIncludePath(platformVersion).length > 0) {
    const platformIncludePath = config.platformIncludePath(platformVersion);
    includes.setPath(platformIncludePath);
  }

  const exePath = `${config.platformExecutablePath(platformVersion)} `;

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: `Processing MQL Code...`,
    },
    () => {
      return new Promise((resolve) => {
        output.clear();
        output.show(true);
        output.appendLine(`[Starting compilation] >>> ${fileInfo.fileName} <<<`);

        let platformExecutablePath = config.platformExecutablePath(platformVersion);

        // Converting to target platform path.
        platformExecutablePath = new UniversalPath(platformExecutablePath).asTargetPath();

        const platformExecutableName = pathModule.basename(platformExecutablePath).toLowerCase();
        const platformExecutableFolder = pathModule.dirname(platformExecutablePath);

        console.log(`Platform executable: "${platformExecutableName}", folder: "${platformExecutableFolder}"`);

        // @fixit Check for folder and file existence.
        //
        // if (!(fs.existsSync(platformExecutableFolder) && (platformExecutableName === 'metaeditor.exe' || platformExecutableName === 'metaeditor64.exe'))) {
        //   output.appendLine(`[Error] Could not locate metaeditor executable file!`);
        //   resolve();
        //   return;
        // }

        let cliInclude;
        let logPath;
        let logDir = '';

        let platformIncludePathBaseFolder = '';

        if (config.platformIncludePath(platformVersion).length > 0 && config.platformIncludePath(platformVersion).endsWith("/Include"))
          platformIncludePathBaseFolder = config.platformIncludePath(platformVersion).substring(0, config.platformIncludePath(platformVersion).length - 8);

        // We want include path to be Windows-specific.
        platformIncludePathBaseFolder = new UniversalPath(platformIncludePathBaseFolder).asCliPath();

        console.log(`Platform include path: ${platformIncludePathBaseFolder}`);

        if (platformIncludePathBaseFolder.length > 0) {
          if (false && !fs.existsSync(platformIncludePathBaseFolder)) {
            return resolve(), output.appendLine(`[Error] Passed include path (base folder) "${platformIncludePathBaseFolder}" doesn't exist!`);
          } else {
            cliInclude = ` /include:"${platformIncludePathBaseFolder}"`;
            //Cpp_prop(platformIncludePath);
          }
        } else {
          cliInclude = '';
        }

        /*

        if (logDir.length) {
          if (pathModule.extname(logDir) === '.log') {
            logPath = path.replace(fileInfo.fileName, logDir);
          } else {
            logPath = path.replace(fileInfo.fileName, logDir + '.log');
          }
        } else {
          logPath = filePath.replace(fileInfo.fileName, fileInfo.fileName.match(/.+(?=\.)/) + '.log');
        }

        */

        logPath = filePath.replace(fileInfo.fileName, fileInfo.fileName.match(/.+(?=\.)/) + '.log');

        //const windowsFilePath = wine.windowsSlashedPathOf(filePath);
        //const windowsLogPath = wine.windowsSlashedPathOf(logPath);

        const fileToCompileCliPath = new UniversalPath(filePath);
        const fileToCompileLogCliPath = fileToCompileCliPath.cloneWithExtension('log');

        console.log(`fileToCompileCliPath = `, fileToCompileCliPath.toString());
        console.log(`fileToCompileLogCliPath = `, fileToCompileLogCliPath.toString());

        // The command we'll execute in order to compile current file.
        const platformSpecificExecutable = new UniversalPath(config.platformExecutablePath(platformVersion)).asTargetPath();

        let command = `"${platformSpecificExecutable}" /compile:"${fileToCompileCliPath.asCliPath()}"${cliInclude}${mode == 1 ? '' : ' /s'} /log:"${fileToCompileLogCliPath.asCliPath()}"`;

        console.log(`Command 1: ${command}`);

        // On non-Windows plaforms or if user ticked "Pass command through WSL (only for Windows platform)." then we run command through wine.
        command = wine.passThroughWineMaybe(platformVersion, command);

        console.log(`Command 2: ${command}`);

        // If on Windows platform and user ticked "Pass command through WSL (only for Windows platform)." then command will be executed on WSL.
        command = wsl.passThroughWslMaybe(command);

        console.log(`Command 3: ${command}`);

        output.appendLine(`$ ${command}`);

        childProcess.exec(command, wine.wslOptions, async (err, stdout, stderr) => {
          if (stderr && false) {
            resolve();
            output.appendLine(`[Error] Compilation failed!\n\nLog from stderr:\n${stderr}\n\nLog from stdout:\n${stdout}`);
            return;
          }

          try {
            // Reading log file.
            const logContent = fs.readFileSync(logPath, 'ucs-2');

            // We don't need full log to be presented to user.
            const humanFriendlyLogContent = log.replaceLog(logContent, mode == 1);

            // Collecting log information.
            var result = await mtlog.parse(logContent, platformVersion);

            // Clearing hints.
            diagnostics.clear();
            diagnostics.set(result.diagnostics);

            console.log('diagnostics', result.diagnostics);

            output.append(humanFriendlyLogContent);
          } catch (e) {
            return vscode.window.showErrorMessage(`Error: ${e}`), resolve();
          }

          if (currentConfig.MTE.RemoveLog) {
            // Removing log file.
            fs.unlink(logPath, (err) => {
              err && vscode.window.showErrorMessage(`Cannot remove log file!`);
            });
          }

          resolve();
        });

        // @todo Timeout withing 30s?
        // sleep(30000).then(() => { resolve(); });
      });
    }
  );
}

module.exports = {
  CompileCommand
};
