const vscode = require('vscode');

// Warnings, errors inside VS code editor.
const diagnostics = require('./diagnostics');

// Extension commands.
const { CompileCommand } = require('./commands/CompileCommand');

// Console output.
const output = require('./output');

/**
 * Extension has been enabled.
 */
function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.checkSyntax', () => CompileCommand(0)));
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.compileFile', () => CompileCommand(1)));
  context.subscriptions.push(diagnostics.collection);

  output.appendLine(`Extension activated.`);
}

/**
 * Extension has been disabled.
 */
function deactivate() {
}

module.exports = {
  activate,
  deactivate
}
