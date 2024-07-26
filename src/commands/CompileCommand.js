const vscode = require('vscode');

const pathModule = require('path');

const includes = require('../includes');

// Extension configuration.
const config = require('../config');

// Console output.
const output = require('../output');

const files = require('../files');

// Executing .exe and wine processes.
const childProcess = require('child_process');

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
function CompileCommand(mode) {
  const currentConfig = config.get();

  output.appendLine(`Compiling...`);

  // Saving current file before checking/compiling.
  vscode.commands.executeCommand('workbench.action.files.saveAll');

  const filePath = vscode.window.activeTextEditor.document.fileName;

  output.appendLine(`Compiling file ${filePath}...`);

  const fileInfo = includes.getInfo(filePath);
  const platformVersion = includes.detectPlatformVersion(filePath);

  console.log(`Detected platform version ${platformVersion} for file "${filePath}".`);

  console.log(currentConfig, config.platformExecutablePath(platformVersion), config.platformIncludePath(platformVersion));

  // Setting include path for C/C++ extension.
  if (config.platformIncludePath(platformVersion).length > 0) {
    const platformIncludePath = config.platformIncludePath(platformVersion);
    includes.setPath(platformIncludePath);
    files.addFolderToWorkspace(platformIncludePath);
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

        const platformExecutableName = pathModule.basename(config.platformExecutablePath(platformVersion)).toLowerCase();
        const platformExecutableFolder = pathModule.dirname(config.platformExecutablePath(platformVersion));

        console.log(`Exe name: "${platformExecutableName}", folder: "${platformExecutableFolder}"`);

        if (!(fs.existsSync(platformExecutableFolder) && (platformExecutableName === 'metaeditor.exe' || platformExecutableName === 'metaeditor64.exe'))) {
          return resolve(), output.appendLine(`[Error] Could not locate metaeditor executable file!`);
        }

        let cliInclude;
        let cliLog;
        let logDir = '';

        let platformIncludePathBaseFolder = '';

        if (config.platformIncludePath(platformVersion).length > 0 && config.platformIncludePath(platformVersion).endsWith("/Include"))
          platformIncludePathBaseFolder = config.platformIncludePath(platformVersion).substring(0, config.platformIncludePath(platformVersion).length - 8);

        console.log(`platformIncludePathBaseFolder: ${platformIncludePathBaseFolder}`);

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

        let command = `"${config.platformExecutablePath(platformVersion)}" /compile:"${filePath}"${cliInclude}${mode == 1 ? '' : ' /s'} /log:"${cliLog}"`;

        output.appendLine(`$ ${command}`);

        childProcess.exec(command, async (err, stdout, stderror) => {

          if (stderror) {
            return resolve(), outputChannel.appendLine(`[Error] Compilation failed!`);
          }

          try {
            let data = fs.readFileSync(cliLog, 'ucs-2');

            data = log.replaceLog(data, mode == 1);

            var result = await mtlog.parse(data, platformVersion);

            diagnostics.clear();
            diagnostics.set(result.diagnostics);


          } catch (e) {
            return vscode.window.showErrorMessage(`Error: ${e}`), resolve();
          }


          /*
          config.LogFile.DeleteLog && fs.unlink(cliLog, (err) => {
                  err && vscode.window.showErrorMessage(lg['err_remove_log']);
              });

          switch (rt) {
              case 0: log = replaceLog(data, false); outputChannel.appendLine(String(log.text)); resolve(); break;
              case 1: log = replaceLog(data, true); outputChannel.appendLine(String(log.text)); resolve(); break;
              case 2: log = cme ? replaceLog(data, true) : replaceLog(data, false); break;
          }

          */

          const end = new Date;

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
