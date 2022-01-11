/**
 * Patches for the `Option()` constructor of `HTMLOptionElement` elements
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement/Option
 *   - https://github.com/aleen42/PersonalWiki/issues/32#issuecomment-484032592
 */

const extend = require('util/extend');

(win => {
    if (win.Option && !/text/.test(new Option('text', 'value').outerHTML)) {
        win.Option = extend(Option, function (Fn, context, args) {
            // the `Option()` is an object and cannot call it directly
            const element = new Fn(
                /* text */ args[0],
                /* value */ args[1],
                /* defaultSelected? */ args[2],
                /* selected? */ args[3]
            );

            // Set its text manually
            element.innerText = args[0];
            return element;
        });
    }
})(window);
