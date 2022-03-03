const http = require('http');
const url = require('url');
const port = require('./server-port');
const _ = require('../../../../util/js');
const querystring = require('querystring');
const queries = u => new url.Url().parse(u, true).query;
const query = (u, key) => queries(u)[key];

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    switch (req.url) {
    case '/request':
        res.writeHead(200, {
            'Content-Type'                 : 'application/json',
            'Access-Control-Allow-Headers' : 'x-test',
            'Access-Control-Allow-Methods' : 'POST, PUT, PATCH, DELETE',
        });
        let data = '';
        req.on('data', c => {
            data += c;
        });
        req.on('end', () => {
            res.end(JSON.stringify({
                method  : req.method,
                url     : req.url,
                headers : req.headers,
                data,
            }));
        });
        break;
    case '/hello':
        res.writeHead(200, {
            'Content-Type'                  : 'text/plain',
            // IE needs to expose it if you want to get from `xhr.getAllResponseHeaders()`
            'Access-Control-Expose-Headers' : 'X-Request-URL',
            'X-Request-URL'                 : `http://${req.headers.host}${req.url}`,
        });
        res.end('hi');
        break;
    case '/hello/utf8':
        res.writeHead(200, {
            'Content-Type' : 'text/plain; charset=utf-8',
        });
        // "hello"
        res.end(Buffer.from([104, 101, 108, 108, 111]));
        break;
    case '/hello/utf16le':
        res.writeHead(200, {
            'Content-Type' : 'text/plain; charset=utf-16le',
        });
        // "hello"
        res.end(Buffer.from([104, 0, 101, 0, 108, 0, 108, 0, 111, 0]));
        break;
    case '/binary':
        res.writeHead(200, {'Content-Type' : 'application/octet-stream'});
        const size = 128; // TODO: IE9 will throw an error when set up to 256
        const buf = Buffer.alloc(size);
        _.times(size, i => {
            buf[i] = i;
        });
        res.end(buf);
        break;
    case '/boom':
        res.writeHead(500, {'Content-Type' : 'text/plain'});
        res.end('boom');
        break;
    case '/empty':
        res.writeHead(204);
        res.end();
        break;
    case '/slow':
        setTimeout(() => {
            res.writeHead(200, {'Cache-Control' : 'no-cache, must-revalidate'});
            res.end();
        }, 100);
        break;
    case '/error':
        res.destroy();
        break;
    case '/form':
        res.writeHead(200, {'Content-Type' : 'application/x-www-form-urlencoded'});
        res.end('number=1&space=one+two&empty=&encoded=a%2Bb&');
        break;
    case '/json':
        res.writeHead(200, {'Content-Type' : 'application/json'});
        res.end(JSON.stringify({name : 'Hubot', login : 'hubot'}));
        break;
    case '/json-error':
        res.writeHead(200, {'Content-Type' : 'application/json'});
        res.end('not json {');
        break;
    default:
        // query
        if (/\/redirect/.test(req.url)) {
            res.writeHead(query(req.url, 'code'), {Location : '/hello'});
            res.end();
        } else if (/\/headers/.test(req.url)) {
            res.writeHead(200, {
                'Access-Control-Expose-Headers' : 'Date',
                Date                            : 'Mon, 13 Oct 2014 21:02:27 GMT',
                'Content-Type'                  : 'text/html; charset=utf-8',
            });
            res.end();
        } else if (/\/cookie/.test(req.url)) {
            let setCookie, cookie;
            const params = queries(req.url);
            if (params.name && params.value) {
                setCookie = [params.name, params.value].join('=');
            }
            if (params.name) {
                cookie = querystring.parse(req.headers['cookie'], '; ')[params.name];
            }
            res.writeHead(200, {
                'Content-Type'                     : 'text/plain',
                'Set-Cookie'                       : setCookie || '',

                // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflight_requests_and_credentials
                'Access-Control-Allow-Credentials' : true,
                'Access-Control-Allow-Origin'      : 'http://localhost:9876',
            });
            res.end(cookie);
        }
        break;
    }
}).listen(port);
