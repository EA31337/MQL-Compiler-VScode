const childProcess = require('child_process');

// Command -> result cache.
const commandCache = {};

/**
 * Executes given command and caches its result. Consecutive calls will return the same result.
 */
function execCached(command, options) {
  if (commandCache[command] != undefined)
    return commandCache[command];

  return commandCache[command] = childProcess.execSync(command, options);
}

module.exports = {
  execCached
};
