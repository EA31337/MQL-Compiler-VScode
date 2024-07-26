const vscode = require('vscode');

/**
 * Searches file by base name and returns URI or undefined.
 * @param {string} fileName
 */
async function searchFileAndGenerateUri(fileName) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  console.log('Workspace folders', workspaceFolders);

  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace is opened');
    return null;
  }

  const fileUris = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**');

  console.log(`File uris for "${fileName}"`, fileUris);

  if (fileUris.length === 0) {
    return null;
  }

  // Here we are returning the first match, but you can add logic to handle multiple matches if needed.
  return fileUris[0];
}

function addFolderToWorkspace(folderPath) {
  const uri = vscode.Uri.file(folderPath);
  const workspaceFolder = { uri, name: uri.fsPath, index: 0 };

  vscode.workspace.updateWorkspaceFolders(
    vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
    null,
    workspaceFolder
  );
}

module.exports = {
  searchFileAndGenerateUri,
  addFolderToWorkspace
};
