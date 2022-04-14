jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
const testsContext = require.context('../lib', true, /-spec$/);
testsContext.keys().forEach(testsContext);
