<!-- AUTOMATICALLY GENERATED BY RUNNING: npm run document -->
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

<details>
    <summary><b>stable</b> <i>(natively supported above IE10)</i></summary>
    <ul>
        <li>Blob (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob" target=_blank>constructor</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Blob/stream" target=_blank>stream</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer" target=_blank>arrayBuffer</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Blob/text" target=_blank>text</a>)<ul><li><i>IE9- throws &quot;Access is denied&quot; when fetching blob URL.
</i></li></ul></li>
        <li>Element (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Element/classList" target=_blank>classList</a>)</li>
        <li>Event (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Event/Event" target=_blank>constructor</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault" target=_blank>preventDefault</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation" target=_blank>stopPropagation</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation" target=_blank>stopImmediatePropagation</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener" target=_blank>addEventListener</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener" target=_blank>removeEventListener</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent" target=_blank>dispatchEvent</a>)</li>
        <li>File (<a href="https://developer.mozilla.org/en-US/docs/Web/API/File/File" target=_blank>constructor</a>)</li>
        <li>FileReader (<a href="https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader" target=_blank>constructor</a>)</li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/FormData" target=_blank>FormData</a></li>
        <li>Global (<a href="https://developer.mozilla.org/en-US/docs/Web/API/atob" target=_blank>atob</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/btoa" target=_blank>btoa</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/console" target=_blank>console</a>)<ul><li><i>only avoid NPE exceptions of calling <code>window.console</code> under IE8 / IE9.
</i></li></ul></li>
        <li>HTMLElement (<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus" target=_blank>focus</a>)</li>
        <li>HTMLOptionElement (<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement/Option" target=_blank>Option</a>)</li>
        <li>URL (<a href="https://developer.mozilla.org/en-US/docs/Web/API/URL/URL" target=_blank>constructor</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams" target=_blank>URLSearchParams</a>)</li>
        <li>XMLHttpRequest (<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send" target=_blank>send</a>)</li>
    </ul>
</details>
<details>
    <summary><b>featured</b> <i>(natively unsupported under IE)</i></summary>
    <ul>
        <li>Abort (<a href="https://developer.mozilla.org/en-US/docs/Web/API/AbortController" target=_blank>AbortController</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal" target=_blank>AbortSignal</a>)</li>
        <li>Fetch (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" target=_blank>Fetch_API</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Headers" target=_blank>Headers</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Request" target=_blank>Request</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Response" target=_blank>Response</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials" target=_blank>credentials</a>)<ul><li><i><code>XMLHttpRequest</code> returns a text rather than a <code>Blob</code> under IE9-, and it means that <code>fetch()</code> cannot handle <code>utf-16le</code> data.
</i></li><li><i>native <code>fetch()</code> <a href="https://github.com/github/fetch/pull/1119">won't normalize</a> the <code>patch</code> method as uppercase.
</i></li><li><i><a href="https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials"><code>credentials</code></a> is not supported under IE9-.
</i></li></ul></li>
        <li>Streams (<a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream" target=_blank>ReadableStream</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/WritableStream" target=_blank>WritableStream</a>)</li>
        <li>Text (<a href="https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder" target=_blank>TextEncoder</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder" target=_blank>TextDecoder</a>)</li>
    </ul>
</details>

### Todo

- [x] Using remote machines to test specifications down to IE9.
- [x] Support testing framework under IE8-.
- [ ] The basic shim of `Blob` has relied on the shim of `web-streams`, which has broken under IE8-.

### Release History

* ==================== **1.0.0 Initial release** ====================
    * 1.0.1 implement polyfills or patches for Blob, File, FileReader, ReadableStream, WritableStream, TextEncoder, TextDecoder, etc.
    * 1.0.2 implement polyfills for Fetch, Event, AbortController, AbortSignal, etc. Also fix some bugs and do some enhancements for CI.
    * 1.0.3 implement polyfills for Element classList. Also upgrade some dependencies, and ensure tests under Node 18+.

### :fuelpump: How to contribute

Have an idea? Found a bug? See [How to contribute](https://wiki.aleen42.com/contribution.html).

### :scroll: License

[MIT](https://wiki.aleen42.com/MIT.html) © aleen42
