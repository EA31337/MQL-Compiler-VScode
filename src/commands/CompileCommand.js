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
  const currentConfig = config.get();

  console.log(debug.extensionDebugModeEnabled ? "Starting in debug mode..." : "Starting in release mode...");
  console.log(debug.configOverrideEnabled ? "[Notice] Config override is enabled. This will probably change MT folders." : "Config override is disabled.");

  output.appendLine(`Compiling...`);

  // Saving current file before checking/compiling.
  vscode.commands.executeCommand('workbench.action.files.saveAll');

  const filePath = vscode.window.activeTextEditor.document.fileName;

  output.appendLine(`Compiling file ${filePath}...`);

  const fileInfo = includes.getInfo(filePath);
  const platformVersion = includes.detectPlatformVersion(filePath);

  console.log(`Detected platform version ${platformVersion} for file "${filePath}".`);

  console.log(`Extension configuration`, currentConfig);

  // Setting include path for C/C++ extension.
  // @note Not needed as we have absolue paths in the log.
  /*
  if (config.platformIncludePath(platformVersion).length > 0) {
    const platformIncludePath = config.platformIncludePath(platformVersion);
    includes.setPath(platformIncludePath);
    await files.addFolderToWorkspace(platformIncludePath);
  }
  */

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

        const platformExecutableName = pathModule.basename(config.platformExecutablePath(platformVersion)).toLowerCase();
        const platformExecutableFolder = pathModule.dirname(config.platformExecutablePath(platformVersion));

        console.log(`Platform executable: "${platformExecutableName}", folder: "${platformExecutableFolder}"`);

        if (!(fs.existsSync(platformExecutableFolder) && (platformExecutableName === 'metaeditor.exe' || platformExecutableName === 'metaeditor64.exe'))) {
          return resolve(), output.appendLine(`[Error] Could not locate metaeditor executable file!`);
        }

        let cliInclude;
        let cliLog;
        let logDir = '';

        let platformIncludePathBaseFolder = '';

        if (config.platformIncludePath(platformVersion).length > 0 && config.platformIncludePath(platformVersion).endsWith("/Include"))
          platformIncludePathBaseFolder = config.platformIncludePath(platformVersion).substring(0, config.platformIncludePath(platformVersion).length - 8);

        console.log(`Platform include path: ${platformIncludePathBaseFolder}`);

        if (platformIncludePathBaseFolder.length > 0) {
          if (!fs.existsSync(platformIncludePathBaseFolder)) {
            return resolve(), output.appendLine(`[Error] Passed include path (base folder) "${platformIncludePathBaseFolder}" doesn't exist!`);
          } else {
            cliInclude = ` /include:"${platformIncludePathBaseFolder}"`;
            //Cpp_prop(platformIncludePath);
          }
        } else {
          cliInclude = '';
        }

        if (logDir.length) {
          if (pathModule.extname(logDir) === '.log') {
            cliLog = path.replace(fileInfo.fileName, logDir);
          } else {
            cliLog = path.replace(fileInfo.fileName, logDir + '.log');
          }
        } else {
          cliLog = filePath.replace(fileInfo.fileName, fileInfo.fileName.match(/.+(?=\.)/) + '.log');
        }

        // The command we'll execute in order to compile current file.
        let command = `"${config.platformExecutablePath(platformVersion)}" /compile:"${filePath}"${cliInclude}${mode == 1 ? '' : ' /s'} /log:"${cliLog}"`;

        output.appendLine(`$ ${command}`);

        childProcess.exec(command, async (err, stdout, stderror) => {
          if (stderror) {
            return resolve(), outputChannel.appendLine(`[Error] Compilation failed!`);
          }

          try {
            // Reading log file.
            const logContent = fs.readFileSync(cliLog, 'ucs-2');

            // We don't need full log to be presented to user.
            const humanFriendlyLogContent = log.replaceLog(logContent, mode == 1);

            // Collecting log information.
            var result = await mtlog.parse(logContent, platformVersion);

            // Clearing hints.
            diagnostics.clear();
            diagnostics.set(result.diagnostics);

            output.append(humanFriendlyLogContent);
          } catch (e) {
            return vscode.window.showErrorMessage(`Error: ${e}`), resolve();
          }

          if (currentConfig.MTE.RemoveLog) {
            // Removing log file.
            fs.unlink(cliLog, (err) => {
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
