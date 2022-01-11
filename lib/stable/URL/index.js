/**
 * Patches for `URL` and `URLSearchParams`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 *   - https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams
 *   - https://github.com/mdn/browser-compat-data/pull/14506
 *   - https://github.com/mdn/browser-compat-data/pull/13820
 *   - https://github.com/Financial-Times/polyfill-library/blob/master/polyfills/URL/polyfill.js
 */

module.exports = (win => {
    const target = process.env['TEST_ENV'] ? {URL : win.URL, URLSearchParams : win.URLSearchParams} : win;

    // need to polyfill
    (() => {
        /**
         * Polyfill when meeting the following situations:
         *   - No global URL object
         *   - URL with static methods only - may have a dummy constructor
         *   - URL with members except searchParams
         */
        if (!win.URL) return 1;
        try {
            if (URL) {
                let url = new URL('https://example.com');
                if ('searchParams' in url) {
                    url.search = 'a=1&b=2';
                    if (url.href === 'https://example.com/?a=1&b=2') {
                        url.search = '';
                        if (url.href === 'https://example.com/') {
                            return; // No need to polyfill
                        }
                    }
                }
            }
        } catch {}

        return 1;
    })() && polyfill();

    // need to patch
    (() => {
        if (new URL('', 'https://www.test.com?sid=1').searchParams.get('sid') !== '1') return 1;
        try { new URL('file://C:/test.png'); } catch { return 1; }
    })() && (target.URL = _.overwrite(target.URL, (Fn, context, args) => {
        const [url, base] = [].slice.call(args);

        /**
         * 1. `new URL('file://C:/')` throws error in Chrome under MacOS
         *    REF: https://github.com/mdn/browser-compat-data/pull/14506
         * 2. keep query arguments under old Edge
         *    REF: https://github.com/mdn/browser-compat-data/pull/13820
         */
        return new Fn(url ? url.replace(/^(file:\/\/)(\w)/, '$1/$2') : base, base);
    }));

    function polyfill() {
        // NOTE: Doesn't do the encoding/decoding dance
        const urlencodedSerialize = pairs => {
            return pairs.map(({name, value}) => `${(encodeURIComponent(name))}=${(encodeURIComponent(value))}`)
                .join('&').replace(/%20/g, '+');
        };

        // NOTE: Doesn't do the encoding/decoding dance
        const urlencodedParse = input => {
            return _.mapFilter(input.split('&'), bytes => {
                if (bytes.length === 0) return;
                const index = bytes.indexOf('='), replace = s => s.replace(/\+/g, ' ');
                const name = replace(index > -1 ? bytes.substring(0, index) : bytes);
                const value = replace(index > -1 ? bytes.substring(index + 1) : '');
                return {name : decode(name), value : decode(value)};
            });

            function decode(val) {
                try {
                    // `decodeURIComponent('%')` throws "URIError: URI malformed"
                    // REF: https://stackoverflow.com/a/54310080/5698182
                    return decodeURIComponent(val);
                } catch {
                    return decodeURIComponent(val.replace(/%(?![0-9][0-9a-fA-F]+)/g, '%25'));
                }
            }
        };

        const URLUtils = (url, doc) => {
            const anchor = doc.createElement('a');
            anchor.href = url;
            return anchor;
        };

        const isValidInit = o => _.isArray(o) || _.isFormData(o) || _.isOBJ(o);
        const SYMBOL_LIST = Symbol('__list__');
        const SYMBOL_URL_INSTANCE = Symbol('__urlInstance__');
        const SYMBOL_FN_SET_LIST = Symbol('__setList__');
        const SYMBOL_FN_UPDATE_STEPS = Symbol('__updateSteps__');
        const privilege = (writable, enumerable, configurable) => ({
            ...writable && {writable : !!writable},
            ...enumerable && {enumerable : !!enumerable},
            ...configurable && {configurable : !!configurable},
        });

        const URLSearchParams = function (init) {
            const self = this;
            self[SYMBOL_LIST] = [];

            if (init == null) {
                // no-op
            } else if (init === DOMException) {
                // Special case of DOMException
                self[SYMBOL_LIST] = urlencodedParse([
                    'INDEX_SIZE_ERR=1', 'DOMSTRING_SIZE_ERR=2', 'HIERARCHY_REQUEST_ERR=3',
                    'WRONG_DOCUMENT_ERR=4', 'INVALID_CHARACTER_ERR=5', 'NO_DATA_ALLOWED_ERR=6',
                    'NO_MODIFICATION_ALLOWED_ERR=7', 'NOT_FOUND_ERR=8', 'NOT_SUPPORTED_ERR=9',
                    'INUSE_ATTRIBUTE_ERR=10', 'INVALID_STATE_ERR=11', 'SYNTAX_ERR=12',
                    'INVALID_MODIFICATION_ERR=13', 'NAMESPACE_ERR=14', 'INVALID_ACCESS_ERR=15',
                    'VALIDATION_ERR=16', 'TYPE_MISMATCH_ERR=17', 'SECURITY_ERR=18',
                    'NETWORK_ERR=19', 'ABORT_ERR=20', 'URL_MISMATCH_ERR=21',
                    'QUOTA_EXCEEDED_ERR=22', 'TIMEOUT_ERR=23', 'INVALID_NODE_TYPE_ERR=24', 'DATA_CLONE_ERR=25',
                ].join('&'));
            } else if (init instanceof URLSearchParams) {
                // In ES6 init would be a sequence, but special case for ES5.
                self[SYMBOL_LIST] = urlencodedParse(`${init}`);
            } else if (init && isValidInit(init) && _.isIterable(init)) {
                self[SYMBOL_LIST] = Array.from(init).map(e => {
                    if (!_.isIterable(e)) throw TypeError();
                    // noinspection JSCheckFunctionSignatures
                    const nv = Array.from(e);
                    if (nv.length !== 2) throw TypeError();
                    return {name : `${nv[0]}`, value : `${nv[1]}`};
                });
            } else if (init && isValidInit(init)) {
                self[SYMBOL_LIST] = Object.keys(init).map(key => ({name : String(key), value : String(init[key])}));
            } else {
                self[SYMBOL_LIST] = urlencodedParse(`${init}`.replace(/^\?/, ''));
            }

            self[SYMBOL_URL_INSTANCE] = null;
            self[SYMBOL_FN_SET_LIST] = list => { !updating && (self[SYMBOL_LIST] = list); };

            let updating = false;
            self[SYMBOL_FN_UPDATE_STEPS] = () => {
                if (updating) return;
                updating = true;

                if (!self[SYMBOL_URL_INSTANCE]) return;

                // Partial workaround for IE issue with 'about:'
                if (self[SYMBOL_URL_INSTANCE].protocol === 'about:'
                    && self[SYMBOL_URL_INSTANCE].pathname.indexOf('?') !== -1) {
                    self[SYMBOL_URL_INSTANCE].pathname = self[SYMBOL_URL_INSTANCE].pathname.split('?')[0];
                }

                self[SYMBOL_URL_INSTANCE].search = urlencodedSerialize(self[SYMBOL_LIST]);

                updating = false;
            };
        };

        /** @lends URLSearchParams */
        Object.defineProperties(URLSearchParams.prototype, {
            append : {
                value(name, value) {
                    this[SYMBOL_LIST].push({name : name, value : `${value}`});
                    this[SYMBOL_FN_UPDATE_STEPS]();
                },
                ...privilege(1, 1, 1),
            },

            'delete' : {
                value(name) {
                    this[SYMBOL_LIST] = this[SYMBOL_LIST].filter(({name : _name}) => _name !== name);
                    this[SYMBOL_FN_UPDATE_STEPS]();
                },
                ...privilege(1, 1, 1),
            },

            get : {
                value(name) { return (_.find(this[SYMBOL_LIST], {name}) || 0).value ?? null; },
                ...privilege(1, 1, 1),
            },

            getAll : {
                value(name) { return _.map(_.filter(this[SYMBOL_LIST], {name}), 'value'); },
                ...privilege(1, 1, 1),
            },

            has : {
                value(name) { return !!_.find(this[SYMBOL_LIST], {name}); },
                ...privilege(1, 1, 1),
            },

            set : {
                value(name, value) {
                    const found = !!_.find(this[SYMBOL_LIST], {name});
                    // keep the only first one item of this name, and set its value
                    this[SYMBOL_LIST] = this[SYMBOL_LIST].reduce((arr, o) =>
                        _.find(arr, {name : o.name}) && o.name === name ? arr
                            : arr.concat(o.name === name ? Object.assign(o, {value}) : o), []);
                    // append if not found
                    found || this[SYMBOL_LIST].push({name, value});
                    this[SYMBOL_FN_UPDATE_STEPS]();
                },
                ...privilege(1, 1, 1),
            },

            entries : {
                value() { return new Iterator(this[SYMBOL_LIST], 'key+value'); },
                ...privilege(1, 1, 1),
            },

            keys : {
                value() { return new Iterator(this[SYMBOL_LIST], 'key'); },
                ...privilege(1, 1, 1),
            },

            values : {
                value() { return new Iterator(this[SYMBOL_LIST], 'value'); },
                ...privilege(1, 1, 1),
            },

            forEach : {
                value(callback) {
                    const thisArg = (arguments.length > 1) ? arguments[1] : void 0;
                    this[SYMBOL_LIST].forEach(({name, value}) => {
                        callback.call(thisArg, value, name);
                    });
                },
                ...privilege(1, 1, 1),
            },

            toString : {
                value() { return urlencodedSerialize(this[SYMBOL_LIST]); },
                ...privilege(1, 0, 1),
            },

            sort : {
                value() {
                    const entries = this.entries();
                    const keys = [];
                    const values = {};

                    let entry = entries.next();

                    while (!entry.done) {
                        const [key, value] = entry.value;
                        keys.push(key);
                        Object.prototype.hasOwnProperty.call(values, key) || (values[key] = []);
                        values[key].push(value);
                        entry = entries.next();
                    }

                    keys.sort();
                    keys.forEach(key => { this.delete(key); });
                    keys.forEach(key => { this.append(key, values[key].shift()); });

                    // Ensure that sorting without keys should tidy the URL instance once
                    this[SYMBOL_URL_INSTANCE] && tidyInstance(this[SYMBOL_URL_INSTANCE]);
                },
            },
        });

        function Iterator(source, kind) {
            let index = 0;
            this.next = () => {
                if (index >= source.length) return {done : true, value : void 0};
                const {name, value} = source[index++];
                return {done : false, value : {key : name, value}[kind] || [name, value]};
            };
        }

        if ('Symbol' in win && 'iterator' in win.Symbol) {
            Object.defineProperty(URLSearchParams.prototype, win.Symbol.iterator, {
                value : URLSearchParams.prototype.entries,
                ...privilege(1, 1, 1),
            });
            Object.defineProperty(Iterator.prototype, win.Symbol.iterator, {
                value() { return this; },
                ...privilege(1, 1, 1),
            });
        }

        const OriginalUrl = win.URL;
        function URL(url, base) {
            if (!(this instanceof URL)) {
                throw new TypeError("Failed to construct 'URL': Please use the 'new' operator.");
            }

            if (base) {
                url = ((() => {
                    let iframe;
                    try {
                        let doc;
                        // Use another document/base tag/anchor for relative URL resolution, if possible
                        if (Object.prototype.toString.call(window['operamini']) === '[object OperaMini]') {
                            iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            document.documentElement.appendChild(iframe);
                            doc = iframe.contentWindow.document;
                        } else if (document.implementation && document.implementation.createHTMLDocument) {
                            doc = document.implementation.createHTMLDocument('');
                        } else if (document.implementation && document.implementation.createDocument) {
                            doc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
                            doc.documentElement.appendChild(doc.createElement('head'));
                            doc.documentElement.appendChild(doc.createElement('body'));
                        } else if (window.ActiveXObject) {
                            doc = new window.ActiveXObject('htmlfile');
                            // noinspection HtmlRequiredTitleElement
                            doc.write('<head></head><body></body>');
                            doc.close();
                        }

                        if (!doc) throw Error('base not supported');

                        const baseTag = doc.createElement('base');
                        baseTag.href = base;
                        doc.getElementsByTagName('head')[0].appendChild(baseTag);
                        return URLUtils(url, doc).href;
                    } finally {
                        if (iframe) { iframe.parentNode.removeChild(iframe); }
                    }
                })());
            }

            /**
             * An inner object implementing URLUtils (either a native URL
             * object or an HTMLAnchorElement instance) is used to perform the
             * URL algorithms. With full ES5 getter/setter support, return a
             * regular object For IE8's limited getter/setter support, a
             * different HTMLAnchorElement is returned with properties
             * overridden
             */
            const instance = URLUtils(url || '', document);

            /**
             * Detect for ES5 getter/setter support
             * (an Object.defineProperties polyfill that doesn't support getters/setters may throw)
             */
            const self = (function () {
                if (!('defineProperties' in Object)) return false;
                try {
                    const obj = {};
                    Object.defineProperties(obj, {prop : {get : () => true}});
                    return obj.prop;
                } catch {
                    return false;
                }
            }()) ? this : document.createElement('a');

            const queryObject = new URLSearchParams(instance.search ? instance.search.substring(1) : null);
            queryObject[SYMBOL_URL_INSTANCE] = self;

            const hideReservedPort = s => s.replace(/:(?:21|80|443)$/, '');
            Object.defineProperties(self, {
                href         : {
                    get : () => hideReservedPort(instance.href),
                    set : v => {
                        instance.href = v;
                        tidyInstance(instance);
                        updateSteps();
                    },
                    ...privilege(0, 1, 1),
                },
                origin       : {
                    get() {
                        if (this.protocol.toLowerCase() === 'data:') return null;
                        if ('origin' in instance) return hideReservedPort(instance.origin)
                        return `${this.protocol}//${this.host}`;
                    },
                    ...privilege(0, 1, 1),
                },
                protocol     : {
                    get : () => instance.protocol,
                    set : v => { instance.protocol = v; },
                    ...privilege(0, 1, 1),
                },
                username     : {
                    get : () => instance.username,
                    set : v => { instance.username = v; },
                    ...privilege(0, 1, 1),
                },
                password     : {
                    get : () => instance.password,
                    set : v => { instance.password = v; },
                    ...privilege(0, 1, 1),
                },
                host         : {
                    get : () => hideReservedPort(instance.host),
                    set : v => { instance.host = v; },
                    ...privilege(0, 1, 1),
                },
                hostname     : {
                    get : () => instance.hostname,
                    set : v => { instance.hostname = v; },
                    ...privilege(0, 1, 1),
                },
                port         : {
                    get : () => instance.port,
                    set : v => { instance.port = v; },
                    ...privilege(0, 1, 1),
                },
                pathname     : {
                    // IE does not include leading '/' in |pathname|
                    get : () => _.let(instance.pathname, name => /^\//.test(name) ? name : `/${name}`),
                    set : v => { instance.pathname = v; },
                    ...privilege(0, 1, 1),
                },
                search       : {
                    get : () => instance.search,
                    set : v => {
                        if (instance.search === v) return;
                        instance.search = v;
                        tidyInstance(instance);
                        updateSteps();
                    },
                    ...privilege(0, 1, 1),
                },
                searchParams : {
                    get : () => queryObject,
                    ...privilege(0, 1, 1),
                },
                hash         : {
                    get : () => instance.hash,
                    set : v => {
                        instance.hash = v;
                        tidyInstance(instance);
                    },
                    ...privilege(0, 1, 1),
                },
                toString     : {
                    value : () => `${instance}`,
                    ...privilege(0, 1, 1),
                },
                valueOf      : {
                    value : () => instance.valueOf(),
                    ...privilege(0, 1, 1),
                },
            });

            function updateSteps() {
                queryObject[SYMBOL_FN_SET_LIST](instance.search ? urlencodedParse(instance.search.substring(1)) : []);
                queryObject[SYMBOL_FN_UPDATE_STEPS]();
            }

            return self;
        }

        function tidyInstance(instance) {
            const href = instance.href.replace(/#$|\?$|\?(?=#)/g, '');
            // Avoid calling setter when the value is as same as before
            instance.href !== href && (instance.href = href);
        }

        target.URL = OriginalUrl ? Object.assign(
            URL,
            _.pickBy(_.objBy(Object.getOwnPropertyNames(OriginalUrl), null, i => {
                try {
                    return _.isFUN(OriginalUrl[i]) && OriginalUrl[i];
                } catch (e) { return false }
            }))
        ) : URL;
        target.URLSearchParams = URLSearchParams;

        // Patch native URLSearchParams constructor to handle sequences / records
        target.URLSearchParams = (new target.URLSearchParams([['a', 1]]).get('a') !== '1'
                               || new target.URLSearchParams({a : 1}).get('a') !== '1')
            ? _.overwrite(URLSearchParams, (Fn, context, args) => {
                const init = args[0];
                if (init && isValidInit(init) && _.isIterable(init)) {
                    const o = new Fn();
                    Array.from(init).forEach(e => {
                        if (!_.isIterable(e)) throw TypeError();
                        // noinspection JSCheckFunctionSignatures
                        const nv = Array.from(e);
                        if (nv.length !== 2) throw TypeError();
                        o.append(nv[0], nv[1]);
                    });
                    return o;
                } else if (init && isValidInit(init)) {
                    const o = new Fn();
                    Object.keys(init).forEach(key => { o.set(key, init[key]); });
                    return o;
                } else {
                    return new Fn(init);
                }
            }) : URLSearchParams;
    }

    return target;
})(window);
