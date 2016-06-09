function isSet(varname) {
  var value = process.env[varname]
  return value ? value != '0' : false
}

var warning = isSet('CI') ? 2 : 1
var error = isSet('REFACTOR') ? 1 : 2
var ignore = 0

// Probably a better way to do this!
// raw: "(?:[^"\\]|\\.){60,}"|'(?:[^'\\]|\\.){60,}'|`(?:[^`\\]|\\.){60,}`
var ignoreLongStrings = "\"(?:[^\"\\\\]|\\\\.){60,}\"|'(?:[^'\\\\]|\\\\.){60,}'|`(?:[^`\\\\]|\\\\.){60,}`"

module.exports = {
  'parser': 'babel-eslint',
  'extends': 'eslint:recommended',
  'rules': {
    'comma-dangle': ignore,
    'no-unused-vars': [warning, {'vars': 'all', 'args': 'none'}],
    'no-console': warning,
    'no-var': error,
    'no-debugger': warning,
    'indent': [warning, 2, {'SwitchCase': 1}],
    'max-len': [warning, 80, 2, { 'ignoreComments': true, ignorePattern: ignoreLongStrings }],
    'prefer-const': warning,
    'semi': [warning, 'always'],
    'no-fallthrough': warning,
    'no-extra-semi': warning
  },
  'settings': {
    'import/parser': 'babel-eslint'
  },
  'env': {
    'node': true
  }
}
