const path = require('path');

module.exports = {
    mode: 'production',
    entry: './dist/transpiled/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    }
};