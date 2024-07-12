const vscode = require('vscode');

const collection = vscode.languages.createDiagnosticCollection('mql_compiler');

/**
 * @param {{[uri: string]: [{lineNo: number, startCol: number, endCol: number, message: string, severity: vscode.Diagnostic}]}} diagnosticsPerUri
 */
function set(diagnosticsPerUri) {
  for (let [uri, diagnostics] of Object.entries(diagnosticsPerUri)) {
    const diagnosticItems = [];

    for (let diagnostic of diagnostics) {
      const range = new vscode.Range(new vscode.Position(diagnostic.lineNo, diagnostic.startCol), new vscode.Position(diagnostic.lineNo, diagnostic.endCol));
      const item  = new vscode.Diagnostic(range, diagnostic.message, diagnostic.severity);
      diagnosticItems.push(item);
    }

    // Associate the diagnostics with the given uri.
    collection.set(vscode.Uri.parse(uri), diagnosticItems);

    console.log(uri, diagnosticItems);
  }
}

function clear() {
  collection.clear();
}

module.exports = {
  collection,
  set,
  clear
};
