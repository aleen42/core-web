/**
 * Patches for `HTMLElement.focus`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
 *   - https://stackoverflow.com/a/18691478/5698182
 */

(win => {
    patchFocus(/* IE9+ */ win.HTMLElement) || patchFocus(/* IE8 */ win.Element);

    function patchFocus(type) {
        const focus = type && type.prototype && type.prototype.focus;
        return focus && (type.prototype.focus = function () {
            /**
             * IE8 throws an error:
             *   "Can't move focus to the control because it is invisible,
             *    not enabled, or of a type that does not accept the focus"
             */
            try {
                focus.call(this);

                /**
                 * fix the bug under IE9 or order, in the case when the cursor has been
                 * set to the head of the string when `focus` event is triggered.
                 */
                const tmp = this.value;
                this.value = '';
                this.value = tmp;
            } catch {}
        });
    }
})(window);
