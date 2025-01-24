/**
 * Polyfills for `Event` and its constructor.
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Event
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
 *   - https://github.com/Financial-Times/polyfill-library/blob/master/polyfills/Event/polyfill.js
 */

module.exports = (win => {
    // calling `target.atob` will throw "TypeError: Illegal invocation" under Chrome when directly pass `win.atob`
    const target = process.env['TEST_ENV'] ? {Event : win.Event} : win;

    // need to polyfill
    (() => {
        if (!target.Event) return 1;
        try {
            // In IE 9-11 and Android 4.x, the Event object exists but cannot be instantiated
            new Event('click');
            return 0;
        } catch {
            return 1;
        }
    })() && polyfill();

    function polyfill() {
        // This polyfill depends on availability of `document` so will not run in a worker
        // However, we assume there are no browsers with worker support that lack proper
        // support for `Event` within the worker
        const existingProto = target.Event && target.Event.prototype;
        const Document = win.Document || win.HTMLDocument;

        function Event(type, eventInitDict) {
            if (!type) throw new Error('Not enough arguments');

            let event;
            // Shortcut if browser supports createEvent
            if ('createEvent' in document) {
                event = document.createEvent('Event');
                const bubbles = eventInitDict && eventInitDict.bubbles != null ? eventInitDict.bubbles : false;
                const cancelable = eventInitDict && eventInitDict.cancelable != null ? eventInitDict.cancelable : false;

                event.initEvent(type, bubbles, cancelable);

                return event;
            }

            event = document.createEventObject();

            event.type = type;
            event.bubbles = eventInitDict && eventInitDict.bubbles != null ? eventInitDict.bubbles : false;
            event.cancelable = eventInitDict && eventInitDict.cancelable != null ? eventInitDict.cancelable : false;

            return event;
        }

        Event.NONE = 0;
        Event.CAPTURING_PHASE = 1;
        Event.AT_TARGET = 2;
        Event.BUBBLING_PHASE = 3;
        target.Event = Window.prototype.Event = Event;

        if (existingProto) {
            Object.defineProperty(target.Event, 'prototype', {
                configurable : false,
                enumerable   : false,
                writable     : true,
                value        : existingProto,
            });
        }

        if (!('createEvent' in document)) {
            const addEventListener = function () {
                const element = this;
                const [type, listener] = arguments;

                if (!element._events) {
                    element._events = {};
                }

                if (!element._events[type]) {
                    element._events[type] = function (event) {
                        var
                            list   = element._events[event.type].list,
                            events = list.slice(),
                            index  = -1,
                            length = events.length,
                            eventElement;

                        // REF: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
                        event.preventDefault = function preventDefault() {
                            if (event.cancelable !== false) {
                                event.returnValue = false;
                            }
                        };

                        // REF: https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
                        event.stopPropagation = function stopPropagation() {
                            event.cancelBubble = true;
                        };

                        // REF: https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation
                        event.stopImmediatePropagation = function stopImmediatePropagation() {
                            event.cancelBubble = true;
                            event.cancelImmediate = true;
                        };

                        event.currentTarget = element;
                        event.relatedTarget = event.fromElement || null;
                        event.target = event.target || event.srcElement || element;
                        event.timeStamp = new Date().getTime();

                        if (event.clientX) {
                            event.pageX = event.clientX + document.documentElement.scrollLeft;
                            event.pageY = event.clientY + document.documentElement.scrollTop;
                        }

                        while (++index < length && !event.cancelImmediate) {
                            if (index in events) {
                                eventElement = events[index];

                                if (list.includes(eventElement) && _.isFUN(eventElement)) {
                                    eventElement.call(element, event);
                                }
                            }
                        }
                    };

                    element._events[type].list = [];

                    if (element.attachEvent) {
                        element.attachEvent(`on${type}`, element._events[type]);
                    }
                }

                element._events[type].list.push(listener);
            };

            // REF: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
            target.addEventListener
                = Window.prototype.addEventListener
                = Document.prototype.addEventListener
                = Element.prototype.addEventListener
                = addEventListener;

            const removeEventListener = function () {
                const element = this;
                const [type, listener] = arguments;

                if (element._events && element._events[type] && element._events[type].list) {
                    const index = element._events[type].list.indexOf(listener);

                    if (index !== -1) {
                        element._events[type].list.splice(index, 1);

                        if (!element._events[type].list.length) {
                            if (element.detachEvent) {
                                element.detachEvent(`on${type}`, element._events[type]);
                            }
                            delete element._events[type];
                        }
                    }
                }
            };

            // REF: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
            target.removeEventListener
                = Window.prototype.removeEventListener
                = Document.prototype.removeEventListener
                = Element.prototype.removeEventListener
                = removeEventListener;

            const dispatchEvent = function (event) {
                if (!arguments.length) throw new Error('Not enough arguments');
                if (!event || !_.isSTR(event.type)) throw new Error('DOM Events Exception 0');

                let element = this;
                const type = event.type, onType = `on${type}`;

                try {
                    if (!event.bubbles) {
                        event.cancelBubble = true;

                        const cancelBubbleEvent = event => {
                            event.cancelBubble = true;
                            (element || target).detachEvent(onType, cancelBubbleEvent);
                        };

                        this.attachEvent(onType, cancelBubbleEvent);
                    }

                    this.fireEvent(onType, event);
                } catch {
                    event.target = element;

                    do {
                        event.currentTarget = element;

                        if ('_events' in element && _.isFUN(element._events[type])) {
                            element._events[type].call(element, event);
                        }

                        if (_.isFUN(element[onType])) {
                            element[onType](event);
                        }

                        element = element.nodeType === 9 ? element.parentWindow : element.parentNode;
                    } while (element && !event.cancelBubble);
                }

                return true;
            };

            // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
            target.dispatchEvent
                = Window.prototype.dispatchEvent
                = Document.prototype.dispatchEvent
                = Element.prototype.dispatchEvent
                = dispatchEvent;

            // Add the DOMContentLoaded Event
            document.attachEvent('onreadystatechange', () => {
                if (document.readyState === 'complete') {
                    document.dispatchEvent(new Event('DOMContentLoaded', {bubbles : true}));
                }
            });
        }
    }

    return target;
})(window);
