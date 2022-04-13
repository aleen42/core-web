## core-web

![npm](https://badges.aleen42.com/src/npm.svg) ![javascript](https://badges.aleen42.com/src/javascript.svg)

A polyfill repository for [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API), trying to eliminate the difference when using them. It mainly focuses on the implementation of Web APIs, which is not the same as [`core-js`](https://github.com/zloirock/core-js/), focusing on JavaScript. As a large project, some APIs should be shimmed step by step, and if you have any polyfill or workaround about those APIs, feel free to contribute to this project.

### Installation

```bash
npm install @aleen42/core-web --save
```

### Usage

```js
// require all shims
import('@aleen42/core-web');
// require shims for only featured APIs
import('@aleen42/core-web/dist/featured.js');
// require shims for only stable APIs
import('@aleen42/core-web/dist/stable.js');
// require core-js shim for implementing
import('@aleen42/core-web/dist/index.all.js');
import('@aleen42/core-web/dist/featured.all.js');
import('@aleen42/core-web/dist/stable.all.js');
// require minimized code
import('@aleen42/core-web/dist/index.min.js');
import('@aleen42/core-web/dist/featured.min.js');
import('@aleen42/core-web/dist/stable.min.js');
import('@aleen42/core-web/dist/index.all.min.js');
import('@aleen42/core-web/dist/featured.all.min.js');
import('@aleen42/core-web/dist/stable.all.min.js');
```

### Polyfills

Check the following list of supported polyfills and feel free to use it. If there are any compatible problems, please report them. All test cases of those specifications have been tested down to IE9.

{{polyfills}}

### Todo

- [x] Using remote machines to test specifications down to IE9.
- [ ] Polyfill for `socket.io` to support testing down to IE7.

### Release History

* ==================== **1.0.0 Initial release** ====================
    * 1.0.1 implement polyfills or patches for Blob, File, FileReader, ReadableStream, WritableStream, TextEncoder, TextDecoder, etc.
    * 1.0.2 implement polyfills for Fetch, Event, AbortController, AbortSignal, etc. Also fix some bugs and do some enhancements for CI.

### :fuelpump: How to contribute

Have an idea? Found a bug? See [How to contribute](https://wiki.aleen42.com/contribution.html).

### :scroll: License

[MIT](https://wiki.aleen42.com/MIT.html) © aleen42
