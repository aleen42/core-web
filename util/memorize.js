module.exports = fn => {
    let cache = false;
    let result;
    return async () => {
        if (cache) {
            return result;
        } else {
            result = await fn();
            cache = true;
            // Allow to clean up memory for fn
            // and all dependent resources
            fn = undefined;
            return result;
        }
    };
};
