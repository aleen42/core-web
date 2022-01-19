const testsContext = require.context('../lib', true, /-spec$/);
testsContext.keys().forEach(testsContext);
