const vscode = require('vscode');

const reFileNameOnly = /^'(.*?)(\.mq4|\.mq5|\.mqh|\.cpp|\.h)'$/i;
const reErrorOrWarning = /^(error : |warning : )(.*?) \((\d+),(\d+)\)$/;

/**
 * Parses log and builds information about warning, errors and other important information.
 *
 * @param {string} content
 */
function parse(content) {
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
      currentFile = isFileNameOnly[0];
      console.log(`Switching file to "${currentFile}".`);
      continue;
    }

    const isErrorOrWarning = reErrorOrWarning.exec(line);

    if (isErrorOrWarning) {
      console.log(isErrorOrWarning);
      const isError  = isErrorOrWarning[1] === 'error : ';
      const message  = isErrorOrWarning[2];
      const lineNo   = parseInt(isErrorOrWarning[3]) - 1;
      const startCol = parseInt(isErrorOrWarning[4]) - 1;
      const endCol   = startCol + 1000;
      //const uri      = currentFile; // @fixit.
      const uri      = vscode.window.activeTextEditor.document.uri;
      const severity = isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;

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

  console.log(result);

  console.log(lines);

  return result;
}

module.exports = {
  parse
};
