const fs = require('fs');
const webpack = require('webpack');
const config = require('./webpack.config');

// clean the dist folder
fs.rmdirSync('dist', {recursive : true});

// build all versions
[0, 1].forEach(minimize => [0, 1].forEach(all => webpack(config(minimize, all)).run(webpackCallback)));

function log(msg) {
    log.logged ? console.log('') : (log.logged = true); // add blank line
    console.log(msg);
}

function webpackCallback(err, stats) {
    if (err) {
        process.exit(1);
    }
    log(stats.toString({
        colors : true,
    }));
}
