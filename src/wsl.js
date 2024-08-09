const config = require('./config');

/**
 * If called on Windows and user ticked "Pass command through WSL (only for Windows platform)." then "wsl.exe" will be
 * prepended to the given command.
 * @param {string} command
 */
function passThroughWslMaybe(command) {
  if (config.current.MTE.PassThroughWSL && process.platform == 'win32')
    return 'wsl.exe ' + command;

  // On non-Windows platforms we just skip WSL part.
  return command;
}

module.exports = {
  passThroughWslMaybe
};
