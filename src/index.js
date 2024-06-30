const pathModule = require('path');

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.checkSyntax', () => Compile(0)));
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.compileFile', () => Compile(1)));
}

function deactivate() {
}

function Compile(mode) {
  vscode.commands.executeCommand('workbench.action.files.saveAll');

  config = vscode.workspace.getConfiguration('mql_compiler');
  extension = pathModule.extname(path);
  fileName = pathModule.basename(path);

  if (extension === '.mq4' || extension === '.mqh' && wn && mode === 0) {
    metaDir = config.MTE.MetaEditor4Path;
    incDir = config.MTE.IncludePath;
  } else if (extension === '.mq5' || extension === '.mqh' && !wn && mode === 0) {
    metaDir = config.MTE.MetaEditor5Path;
    incDir = config.MTE.IncludePath;
  } else {
    return undefined;
  }

}

module.expomodes = {
  activate,
  deactivate
}
