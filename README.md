# MQL Compiler (VSCode)

This is VS Code extension to add support for MQL files.

## Build

Steps to install extension from the source code:

```console
npm install
npm run package
```

This will generate a .vsix file which can be install from the editor.

## Install from file

In VS Code editor, open extension pane and choose "Install from VSIX...",
then select previously generated .vsix file.

This can also be achieved by dragging and dropping the file into the editor's
extension pane.

Alternatively to install extension from the command-line, run:

```console
code --install-extension mql-compiler-vscode-0.1.0.vsix
```
