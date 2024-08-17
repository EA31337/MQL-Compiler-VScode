const vscode = require('vscode');

/**
 * Searches file by base name and returns URI or undefined.
 */
async function searchFileAndGenerateUri(fileName) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace is opened. Cannot search for files in order to show hints.');
    return null;
  }

  const fileUris = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**');

  if (fileUris.length === 0) {
    return null;
  }

  // Here we are returning the first match, but you can add logic to handle multiple matches if needed.
  return fileUris[0];
}

/**
 * Asynchronously adds given folder to the workspace. Won't duplicate URIs.
 */
async function addFolderToWorkspace(folderPath) {
  const uri = vscode.Uri.file(folderPath);
  const workspaceFolder = { uri, name: uri.fsPath, index: 0 };
  return new Promise((resolve, reject) => {
    // Set up the event listener for workspace folder changes
    const disposable = vscode.workspace.onDidChangeWorkspaceFolders(event => {
      disposable.dispose(); // Clean up the listener after the event is handled.
      resolve(event); // Resolve the promise when the event is fired.
    });

    // Update workspace folders.
    if (!vscode.workspace.updateWorkspaceFolders(
      vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
      null,
      workspaceFolder
    )) {
      // onDidChangeWorkspaceFolders() won't be called.
      console.log(`[Error] Adding folder "${uri}" failed.`);
      resolve();
    }
  });
}

module.exports = {
  searchFileAndGenerateUri,
  addFolderToWorkspace
};
