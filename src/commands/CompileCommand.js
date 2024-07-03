const vscode = require('vscode');

const pathModule = require('path');

// Extension configuration.
const config = require('../config');

// Console output.
const output = require('../output');

// Executing .exe and wine processes.
const { execFile } = require('child_process');

/**
 * Checks syntax or compiles MQL file.
 *
 * @param {boolean} mode 0 - Check syntax, 1 - Compile.
 */
function CompileCommand(mode)
{
  output.appendLine(`Compiling...`);

  // Saving current file before checking/compiling.
  vscode.commands.executeCommand('workbench.action.files.saveAll');

  const filePath = vscode.window.activeTextEditor.document.fileName;

  output.appendLine(`Compiling file ${filePath}...`);

  const fileExtension = pathModule.extname(filePath).toLowerCase();
  const fileName      = pathModule.basename(filePath);

  let platformExecutablePath;
  let platformIncludePath;

  // For .mqh files we need to detect whether we're working in MQL4 or MQL5 mode.
  const platformDetectedMQL4 = vscode.workspace.name?.includes('MQL4');
  const usePlatform4 = fileExtension === '.mq4' || fileExtension === '.mqh' && platformDetectedMQL4;
  const usePlatform5 = fileExtension === '.mq5' || fileExtension === '.mqh' && !platformDetectedMQL4;

  if (!usePlatform4 && !usePlatform5) {
    vscode.window.showWarningMessage(`Error: Unsupported file format "${fileExtension}"!`);
    return undefined;
  }

  platformExecutablePath = usePlatform4 ? config.MTE.MetaEditor4Path : config.MTE.MetaEditor5Path;
  platformIncludePath    = usePlatform4 ? config.MTE.IncludePath4    : config.MTE.IncludePath5;

  const exePath = `${platformExecutablePath} `;

  vscode.window.withProgress(
    {
        location: vscode.ProgressLocation.Window,
        title: `Processing MQL Code...`,
    },
    () => {
        return new Promise((resolve) => {
            output.clear();
            output.show(true);
            output.appendLine(`[Starting compilation] >>> ${fileName} <<<`);

            const platformExecutableName  = pathModule.basename(MetaDir);
            const platformExecutableFolder = pathModule.dirname(MetaDir);

            if (!(fs.existsSync(platformExecutableFolder) && (platformExecutableName === 'metaeditor.exe' || platformExecutableName === 'metaeditor64.exe'))) {
                return resolve(), outputChannel.appendLine(`[Error] Could not locate metaeditor executable file!`);
            }

            let cliInclude;
            let cliLog;
            let logDir = '';


            if (platformIncludePath.length) {
                if (!fs.existsSync(incDir)) {
                    return resolve(), outputChannel.appendLine(`[Error]  ${CommI} [ ${incDir} ]`);
                } else {
                    cliInclude = ` /include:"${incDir}"`;
                    //Cpp_prop(platformIncludePath);
                }
            } else {
                cliInclude = '';
            }

            if (logDir.length) {
                if (pathModule.extname(logDir) === '.log') {
                    cliLog = path.replace(fileName, logDir);
                } else {
                    cliLog = path.replace(fileName, logDir + '.log');
                }
            } else {
                cliLog = path.replace(fileName, fileName.match(/.+(?=\.)/) + '.log');
            }

            let command = `"${platformExecutablePath}" /compile:"${filePath}"${cliInclude}${mode == 1 ? '' : ' /s'} /log:"${cliLog}"`;

            childProcess.exec(command, (err, stdout, stderror) => {

                if (stderror) {
                    return resolve(), outputChannel.appendLine(`[Error] Compilation failed!`);
                }

                try {
                    var data = fs.readFileSync(cliLog, 'ucs-2');
                } catch (err) {
                    return vscode.window.showErrorMessage(`${lg['err_read_log']} ${err}`), resolve();
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
            });

            sleep(30000).then(() => { resolve(); });
        });
    }
);

exports.CompileCommand = CompileCommand;
