const vscode = require('vscode');
const debug = require('./debug');

function get() {
  let config = debug.disabled ? vscode.workspace.getConfiguration('mql_compiler') : {
    // Setting local paths. For debugging only.
    MTE: {
      MetaEditor5Path: "c:/Program Files/MetaTrader 5/MetaEditor64.exe",
      IncludePath5: "c:/Users/MX/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Include"
    }
  };

  return config;
}

function platformExecutablePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.MetaEditor4Path;
    case 5:
      return config.MTE.MetaEditor5Path;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

function platformIncludePath(platformVersion) {
  const config = get();
  switch (platformVersion) {
    case 4:
      return config.MTE.IncludePath4;
    case 5:
      return config.MTE.IncludePath5;
    default:
      throw new Error(`Error: Unsupported platform version ${platformVersion}!`);
  }
}

module.exports = {
  get,
  platformExecutablePath,
  platformIncludePath
};
