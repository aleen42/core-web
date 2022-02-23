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
 *  - Document: stable/index.js
 *  - Author: aleen42
 *  - Description: Shims for stable Web APIs
 *  - Create Time: Jan 10th, 2022
 *  - Update Time: Feb 24th, 2022
 *
 */

// noinspection JSUnresolvedFunction
const shims = require.context('.', true, /^((?<!test\/).(?!-spec|chunk))+\.js$/);
shims.keys().forEach(shims);
