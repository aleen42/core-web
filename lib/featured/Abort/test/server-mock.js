const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const port = require('./server-port');
const _ = require('../../../../util/js');
const assets = {
    '/polyfill.js' : path.resolve(__dirname, '../../../../node_modules/@aleen42/karma-polyfill/dist/index.min.js'),
    // eslint-disable-next-line max-len
    '/fetch-polyfill.js' : path.resolve(__dirname, '../../../../node_modules/whatwg-fetch/dist/fetch.umd.js'),
    // eslint-disable-next-line max-len
    '/abort-controller-polyfill.js' : path.resolve(__dirname, '../../../../node_modules/abortcontroller-polyfill/dist/umd-polyfill.js'),
    '/web-worker.js'                : path.resolve(__dirname, 'web-worker.js'),
};

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (/\/\?sleepMillis/.test(req.url)) {
        // noinspection JSCheckFunctionSignatures
        setTimeout(() => {
            res.writeHead(200);
            res.end();
        }, new url.Url().parse(req.url, true).query['sleepMillis']);
    } else if (/\.js$/.test(req.url)) {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(fs.readFileSync(assets[req.url], 'utf8'));
    }
}).listen(port);

// noinspection HttpUrlsUsage
module.exports = {
    // mock assets in the karma server to solve the problem of same origin policy when accessing workers
    /** @see test/mock.js */
    proxies : _.mapValues(assets, (value, key) => `http://localhost:${port}${key}`),
};
