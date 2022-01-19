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
 *  - Update Time: Jan 18th, 2022
 *
 */

const _ = require('./util/js');
const webpackConfig = Object.assign({}, require('./webpack.config')(0, 1, 1));
delete webpackConfig.entry;
delete webpackConfig.output;

module.exports = config => {
    // IE8 / IE7 (karma not support socket.io)
    const trifleJS = process.platform === 'win32' ? ['IE9', 'IE10', 'Edge12'] : [];

    config.set({
        webpack         : webpackConfig,
        files           : ['test/index.js'],
        preprocessors   : {'test/index.js' : ['webpack', 'sourcemap']},
        frameworks      : ['jasmine', 'webpack', 'detectBrowsers', 'polyfill'],
        browsers        : ['PhantomJS', ...trifleJS],
        reporters       : ['mocha'],
        singleRun       : true,
        customLaunchers : _.objBy(trifleJS, null, version => ({
            base        : 'TrifleJS',
            flags       : [`--emulate=${version}`],
            displayName : `${version} (TrifleJS emulated)`,
        })),
        plugins         : [
            'karma-jasmine',
            'karma-mocha-reporter',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-ie-launcher',
            'karma-phantomjs-launcher',
            '@chiragrupani/karma-chromium-edge-launcher',
            '@coremail/karma-detect-browsers',
            '@aleen42/karma-triflejs-launcher',
            '@aleen42/karma-polyfill',
        ],

        client : {jasmine : {random : false}},

        detectBrowsers : {
            // ref: https://github.com/karma-runner/karma-safari-launcher/issues/12
            'postDetection' : availableBrowser => availableBrowser.filter(name => name !== 'Safari'),
        },
    });
};
