const vscode = require('vscode');

// Extension commands.
const { CompileCommand } = require('./commands/CompileCommand');

// Console output.
const output = require('./output');

/**
 * Extension has been enabled.
 */
function activate(context)
{
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.checkSyntax', () => CompileCommand(0)));
  context.subscriptions.push(vscode.commands.registerCommand('mql_compiler.compileFile', () => CompileCommand(1)));

  output.appendLine(`Extension activated.`);
}

/**
 * Extension has been disabled.
 */
function deactivate()
{
}

module.exports = {
  activate,
  deactivate
}
