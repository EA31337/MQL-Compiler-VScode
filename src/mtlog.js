const vscode = require('vscode');
const output = require('./output');
const includes = require('./includes');
const workspace = require('./workspace');
const wine = require('./wine');
const { UniversalPath } = require('./universalpath');

const reFileNameOnly = /^DISABLEDX$/i;
const reErrorOrWarning = /(^.*?)\((\d+),(\d+)\) : (error|warning) \d+: (.*?)$/;

/**
 * Parses log and builds information about warning, errors and other important information.
 * @param {string} content
 */
async function parse(content, platformVersion) {
  // Firstly, we split content into lines. We will be checking one line at a time.
  lines = content.split(/\r?\n|\r/);

  // File that previously occured in the log.
  let currentFile = '';

  const result = {
    diagnostics: {}
  };

  for (let line of lines) {
    const isFileNameOnly = reFileNameOnly.exec(line);

    if (isFileNameOnly) {
      currentFile = isFileNameOnly[1];
      continue;
    }

    const isErrorOrWarning = reErrorOrWarning.exec(line);

    if (isErrorOrWarning) {
      // We'll be adding diagnostics with related file URIs.
      console.log(isErrorOrWarning);
      const filePath = isErrorOrWarning[1];
      const isError = isErrorOrWarning[4] === 'error';
      const message = isErrorOrWarning[5];
      const lineNo = parseInt(isErrorOrWarning[2]) - 1;
      const startCol = parseInt(isErrorOrWarning[3]) - 1;
      const endCol = startCol + 1000;
      const severity = isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
      const uri = vscode.Uri.file(new UniversalPath(filePath).asTargetPath());

      if (!result.diagnostics[uri])
        result.diagnostics[uri] = [];

      result.diagnostics[uri].push({
        lineNo,
        startCol,
        endCol,
        message,
        severity
      })
    }
  }

  return result;
}

module.exports = {
  parse
};
