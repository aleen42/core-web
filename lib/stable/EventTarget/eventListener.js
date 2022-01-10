/**
 * Patches for `EventTarget.{addEventListener, removeEventListener}`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 *   - https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
 *   - https://gist.github.com/eirikbacker/2864711
 *   - https://gist.github.com/mwrouse/8e6bff2ed20851e2faf8e8f5398097a2
 */

const _event = require('../Event');
const isFUN = fn => typeof fn === 'function';

// description for `EventTarget.{attachEvent, detachEvent}` under IE8-
void {attachEvent : () => {}, detachEvent : () => {}};

((win, doc) => {
    if (win.addEventListener && win.removeEventListener) return;
    if (!win.attachEvent || !win.detachEvent) return;

    const PHASE_CAPTURING = 1, PHASE_AT_TARGET = 2, PHASE_BUBBLING = 3;
    const __listeners = new Map();

    function addEventListener(type, callback, useCapture) {
        useCapture = !!useCapture;

        const self = this;

        // Properties that hold the event listeners
        let __listener;
        __listeners.set(self, (__listener = __listeners.get(self) || {}));
        __listener[type] = __listener[type] || [];

        // Listener object that will go in the array
        const listener = {fn : callback, useCapture};

        // Only register the event once
        if (__listener[type].length === 0) {
            const attachType = `on${type}`;
            // Create event listener for the first time
            __listener[attachType] = e => {
                e = _event(e);

                e.target = e.srcElement || self;

                const domList = [];
                let node = e.target;

                // Get all nodes for propagation of the event
                while (node) {
                    domList.unshift(node);
                    node = node.parentNode;
                }
                if (domList[0] !== win) domList.unshift(win);

                e.view = domList[0]; // e.view is a reference to the window object where the event was called


                // Capturing Phase (Window -> Target)
                domList.forEach(handle(1));
                // Bubbling Phase (Target -> Window)
                domList.reverse().forEach(handle(0));

                e.cancelBubble = true;

                function handle(capturing) {
                    return el => {
                        e.eventPhase = (self === el) ? PHASE_AT_TARGET : (capturing ? PHASE_CAPTURING : PHASE_BUBBLING);
                        e.currentTarget = el;

                        // No events on this element
                        if (!__listeners.get(el) || !__listeners.get(el)[type]) return;

                        // Call all the listeners on this element for this action
                        __listeners.get(el)[type].some(listener => {
                            // Invalid callback or not matched capturing
                            if ((capturing ? !listener.useCapture : listener.useCapture) || !isFUN(listener.fn)) return;

                            // Call the event listener
                            listener.fn.call(el, e);

                            // Do not continue if propagation was stopped
                            if (e.cancelBubble) return true;
                        });
                    };
                }
            };

            // Use attachEvent to create the event listener
            self.attachEvent(attachType, __listener[attachType]);
        }

        // Add the listener to the polyfill
        __listener[type].push(listener);
    }


    function removeEventListener(type, listener, useCapture) {
        useCapture = !!useCapture;

        const self = this;

        // Properties that hold the event listeners
        let __listener;
        __listeners.set(self, (__listener = __listeners.get(self) || {}));
        __listener[type] = __listener[type] || [];

        // Find the event listener and remove it
        __listener[type] = __listener[type].filter(e => e.fn !== listener || e.useCapture !== useCapture);

        // If no more events exist, remove the event listener
        const detachType = `on${type}`;
        if (__listener[type].length === 0 && isFUN(__listener[detachType])) {
            self.detachEvent(detachType, __listener[detachType]);
        }
    }

    // Applies the polyfill to an element
    function polyfill(el) {
        el.addEventListener = addEventListener;
        el.removeEventListener = removeEventListener;

        return el;
    }

    // Alters a function on the document
    function ReplaceDocFunction(fn) {
        const old = doc[fn];
        doc[fn] = param => polyfill(old(param));
    }

    // Apply the polyfills
    polyfill(win);
    polyfill(doc);

    // Add polyfill to window.Element if possible
    if (win.Element && win.Element.prototype) {
        // IE8
        polyfill(win.Element.prototype);
    } else {
        // IE7-
        // Apply the polyfill to all of the elements in the document
        Array.from(doc.all).forEach(polyfill);

        // Make sure to also init when the DOM is ready
        doc.attachEvent('onreadystatechange', () => { Array.from(doc.all).forEach(polyfill); });

        // Change these important functions to return something that has the event listener functions
        ['getElementById', 'getElementsByTagName', 'createElement'].forEach(ReplaceDocFunction);
    }
})(window, document);
