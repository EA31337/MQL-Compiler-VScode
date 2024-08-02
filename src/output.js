const vscode = require('vscode');

// Console output.
const output = vscode.window.createOutputChannel('MQL', 'mql-output');

output.clear();
output.show(true);

module.exports = output;
