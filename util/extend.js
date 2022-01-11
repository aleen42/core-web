module.exports = (Fn, cb) => {
    function CLS() { return cb(Fn, this, arguments) }
    CLS.prototype = Object.create(Fn.prototype);
    return CLS;
};
