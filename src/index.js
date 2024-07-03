const vscode = require('vscode');
const output = require('./output');

// Extension life-cycle functions.
const { activate, deactivate } = require('./lifecycle');

module.exports = {
  activate,
  deactivate
}
