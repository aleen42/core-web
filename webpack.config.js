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
 *  - Author: aleen42
 *  - Description: webpack configurations for bundling code
 *  - Create Time: Jan 10th, 2022
 *  - Update Time: Jan 11st, 2022
 *
 */

const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ES3HarmonyPlugin = require('./build/ES3HarmonyPlugin');

module.exports = (minimize, all, test) => ({
    mode   : 'production',
    target : ['web', 'es5'],
    output : {
        path : path.resolve(__dirname, 'dist'),
    },

    module : {
        rules : [{
            test : /\..?js$/,
            use  : {
                loader  : 'babel-loader',
                options : {
                    presets : [
                        ['@babel/env', {
                            forceAllTransforms : true,
                            loose              : true,
                            modules            : false, // ES6 modules should be processed only by webpack

                            // naming anonymous functions is problematic
                            // REF: https://github.com/babel/babel/issues/1087#issuecomment-373375175
                            exclude : ['@babel/plugin-transform-function-name'],
                        }],
                    ],
                },
            },
        }],
    },

    entry : {
        [`index${all ? '.all' : ''}${minimize ? '.min' : ''}`]    : [...all ? ['./lib/polyfill'] : [], './lib/index'],
        [`featured${all ? '.all' : ''}${minimize ? '.min' : ''}`] : [
            ...all ? ['./lib/polyfill'] : [], './lib/featured/index',
        ],
        [`stable${all ? '.all' : ''}${minimize ? '.min' : ''}`]   : [
            ...all ? ['./lib/polyfill'] : [], './lib/stable/index',
        ],
    },

    optimization : minimize ? {
        minimizer : [new TerserPlugin({terserOptions : {ie8 : true}})],
    } : {minimize : false},

    plugins : [
        new ES3HarmonyPlugin(),
        new webpack.DefinePlugin({
            'process.env' : {
                'TEST_ENV' : !!test,
            },
        }),
    ],
});
