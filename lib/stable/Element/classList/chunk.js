module.exports = self => {
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('classlist.js')).replace('classListProto =', 'classListProto = self.classListProto =');
    // noinspection JSUnresolvedVariable
    return self.classListProto;
};
