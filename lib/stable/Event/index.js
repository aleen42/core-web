/**
 * Patches for `Event`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Event
 *   - https://gist.github.com/mwrouse/8e6bff2ed20851e2faf8e8f5398097a2
 */

(win => {
    if (win.Event /* IE6 does not have global Event object */ && Event.prototype) {
        Event.prototype.preventDefault || (Event.prototype.preventDefault = function () {
            this.returnValue = false;
            this.defaultPrevented = true;
        });

        Event.prototype.stopPropagation || (Event.prototype.stopPropagation = function () {
            this.cancelBubble = true
        });
    }
})(window);

module.exports = e => {
    e = e || window.event;

    e.eventPhase = e.eventPhase || 0;
    e.defaultPrevented = e.defaultPrevented || false;
    e.bubbles = e.bubbles || true;
    e.cancelable = e.cancelable || true;
    e.view = e.view || void 0;
    return e;
};
