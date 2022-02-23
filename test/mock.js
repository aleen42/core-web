// To run mock code under NodeJS for testing purposes
const glob = require('glob');
const path = require('path');
const cwd = path.resolve(__dirname, '../lib/');

const proxies = {};
glob.sync('**/*-mock.js', {cwd}).forEach(file => {
    // Set up assets in the Karma server
    Object.assign(proxies, require(path.resolve(__dirname, `../lib/${file}`)).proxies);
});

module.exports = {proxies};
