require('../lib/polyfill');

// implement `regeneratorRuntime` for asynchronous test cases
require('@babel/polyfill');

const testsContext = require.context('../lib', true, /-spec$/);
testsContext.keys().forEach(testsContext);
