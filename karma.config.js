/*
 *                                                               _
 *   _____  _                           ____  _                 |_|
 *  |  _  |/ \   ____  ____ __ ___     / ___\/ \   __   _  ____  _
 *  | |_| || |  / __ \/ __ \\ '_  \ _ / /    | |___\ \ | |/ __ \| |
 *  |  _  || |__. ___/. ___/| | | ||_|\ \___ |  _  | |_| |. ___/| |
 *  |_/ \_|\___/\____|\____||_| |_|    \____/|_| |_|_____|\____||_|
 *
 *  ===============================================================
 *             More than a coder, More than a designer
 *  ===============================================================
 *
 *  - Document: karma configurations for unit testing
 *  - Author: aleen42
 *  - Description: Shims for featured Web APIs
 *  - Create Time: Jan 11st, 2022
 *  - Update Time: Jan 24th, 2025
 *
 */

const {proxies} = require('./test/mock.js');
const _ = require('./util/js');
const webpackConfig = Object.assign({}, require('./webpack.config')(0, 1, 1));
delete webpackConfig.entry;
delete webpackConfig.output;

module.exports = config => {
    const withShims = process.argv[4] === 'shims';
    // TODO: The basic shim of `Blob` has relied on the shim of `web-streams`, which has broken under IE8-.
    // eslint-disable-next-line
    const simulatedIEs = [...[/*7, 8, */9, 10, 11].map(i => `IE${i}`), 'Edge12'];

    // Chrome Headless via Puppeteer
    // noinspection JSUnresolvedFunction
    process.env.CHROME_BIN = require('puppeteer').executablePath();

    config.set({
        // TODO: fix conflicts when launching multiple IE instances at the same time
        concurrency              : 1,
        browserNoActivityTimeout : 60000,
        proxies,
        webpack                  : webpackConfig,
        files                    : [...withShims ? ['lib/polyfill.js'] : [], 'test/index.js'],
        preprocessors            : {
            'lib/polyfill.js' : ['webpack', 'sourcemap'],
            'test/index.js'   : ['webpack', 'sourcemap'],
        },
        frameworks               : ['jasmine-polyfill', 'webpack', 'detectBrowsers', 'polyfill'],
        reporters                : ['mocha'],
        singleRun                : true,
        customLaunchers          : {
            ..._.objBy(simulatedIEs, null, version => ({
                base              : 'IE',
                displayName       : `${version} (document mode)`,
                'x-ua-compatible' : `IE=Emulate${version}`,
            })),

            // Cannot start ChromeHeadless under latest Ubuntu
            // ref: https://github.com/karma-runner/karma-chrome-launcher/issues/175
            HeadlessChrome   : {base : 'ChromeHeadless', flags : ['--no-sandbox', '--disable-setuid-sandbox']},
            HeadlessChromium : {base : 'ChromiumHeadless', flags : ['--no-sandbox', '--disable-setuid-sandbox']},
            HeadlessFirefox  : {base : 'FirefoxHeadless'},
        },
        plugins                  : [
            '@aleen42/karma-polyfill/jasmine',
            'karma-mocha-reporter',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            '@aleen42/karma-ie-launcher',
            '@chiragrupani/karma-chromium-edge-launcher',
            '@aleen42/karma-detect-browsers',
            '@aleen42/karma-polyfill',
        ],

        client : {jasmine : {random : false}},

        detectBrowsers : {
            usePhantomJS    : false,
            'postDetection' : availableBrowser => {
                // use IE (IE11) to simulate with different document mode
                availableBrowser.includes('IE') && availableBrowser.push(...simulatedIEs);
                // use headless Chrome or Firefox under CI
                availableBrowser = availableBrowser.map(name =>
                    name.replace(/^(Chrome|Chromium|Firefox)$/, process.env['CI_SERVER'] ? 'Headless$1' : '$1'));

                // REF: https://github.com/karma-runner/karma-safari-launcher/issues/12
                return availableBrowser.filter(name => name !== 'Safari');
            },
        },
    });
};
