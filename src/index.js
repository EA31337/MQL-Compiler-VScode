// Extension life-cycle functions.
const { activate, deactivate } = require('./lifecycle');
const { runTests } = require('./tests');

module.exports = {
  activate,
  deactivate
}

runTests();
