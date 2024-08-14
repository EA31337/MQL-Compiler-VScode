const childProcess = require('child_process');

const config = require('./config');

// Command -> result cache.
const commandCache = {};

function execCached(command) {
  if (commandCache[command] != undefined)
    return commandCache[command];

  return commandCache[command] = childProcess.execSync(command);
}

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
  execCached,
  passThroughWslMaybe
};
