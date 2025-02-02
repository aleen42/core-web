/* eslint-disable no-new-func */
// @formatter:off
// language=JavaScript
module.exports = source => source.replace(
    / *_\['@@embed-source']\(require\('([^']*)'\)\)([^;]*);/g,
    (line, id, remain) => `
    // embedded source: ${id} (AUTO GENERATED BY: EmbedSourceLoader)
    ${(new Function(`return \`${require('fs').readFileSync(require.resolve(id), 'utf8')
        .replace(/[\\`]/g, '\\$&')
        .replace(/\${/g, '\\${')
    }\`${remain || ''}`)())}
`);
