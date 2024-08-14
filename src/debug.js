const vscode = require('vscode');

module.exports = {
  // You may force debug logging via switching this to true.
  forceEnable: false,

  // Whether we want to override MT folders to the ones in "config".
  overrideConfig: false,

  // Whether we want to enable debug logging.
  get enabled() { return this.extensionDebugModeEnabled || this.forceEnable; },

  // Whether we want to override MT folders to the ones in "config".
  get configOverrideEnabled() { return this.overrideConfig; },

  // Debug configuration. Used when "configOverrideEnabled" is true.
  configOverride: {
    MTE: {
      MetaEditor5Path: "c:/Program Files/MetaTrader 5/MetaEditor64.exe",
      IncludePath5: "c:/Users/MX/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Include",
      RemoveLog: false,
      PassThroughWSL: false
    }
  },

  get extensionDebugModeEnabled() { return vscode.debug.activeDebugSession; },
  get disabled() { return !module.exports.enabled; }
};


