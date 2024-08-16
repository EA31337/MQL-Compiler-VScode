const config = require('./config');

const wslOptions = {
  env: {
    ...process.env,
    WINEDEBUG: '-all'
  }
};

/**
 * If called on Windows and user ticked "Pass command through WSL (only for Windows platform)." then "wsl.exe" will be
 * prepended to the given command.
 * @param {string} command
 */
function passThroughWslMaybe(command) {
  if (config.current.MTE.PassThroughWSL && process.platform == 'win32')
    command = 'wsl.exe ' + command;

  return command;
}

module.exports = {
  wslOptions,
  passThroughWslMaybe
};
