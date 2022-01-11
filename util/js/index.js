const noop = () => {};
// is null or undefined

const extend = (Fn, cb) => {
    function CLS() { return cb(Fn, this, arguments) }
    CLS.prototype = Object.create(Fn.prototype);
    return CLS;
};

/** @lends _ */
module.exports = {
    noop,
    extend,
};
