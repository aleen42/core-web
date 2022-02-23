// noinspection ES6ConvertVarToLetConst

self.importScripts('polyfill.js');
self.importScripts('fetch-polyfill.js');
self.importScripts('abort-controller-polyfill.js');

// need to be compatible within IE10
self.onmessage = function (ev) {
    setTimeout(function () { postMessage(false); }, 10000);
    var controller = new AbortController();
    var signal = controller.signal;
    setTimeout(function () { controller.abort(); }, 500);
    fetch(ev.data, {signal : signal})
        .then(function () { postMessage(false); })
        .catch(function (err) { postMessage(err.name === 'AbortError'); });
};
