jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

const IE8_DOM_DEFINE = require('core-js/internals/ie8-dom-define');
// karma kill IE8 with `client.clearContext` will trigger reload,
// result in an error "Some of your tests did a full page reload"
IE8_DOM_DEFINE && (window.onbeforeunload = _.noop);

const testsContext = require.context('../lib', true, /-spec$/);
testsContext.keys().forEach(testsContext);
