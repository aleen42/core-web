/**
 * Patches for `console` to avoid error
 *
 * NOTE: only avoid NPE exceptions of calling `window.console` under IE8 / IE9.
 * e.g. console is not defined on IE8 / IE9 unless dev tools are open, and IE doesn't define console.debug
 *
 *
 * Chrome 41.0.2272.118: debug,error,info,log,warn,dir,dirxml,table,trace,assert,count,markTimeline,
 *                       profile,profileEnd,time,timeEnd,timeStamp,timeline,timelineEnd,group,groupCollapsed,
 *                       groupEnd,clear
 * Firefox 37.0.1:       log,info,warn,error,exception,debug,table,trace,dir,group,groupCollapsed,groupEnd,time,
 *                       timeEnd,profile,profileEnd,assert,count
 * Internet Explorer 11: select,log,info,warn,error,debug,assert,time,timeEnd,timeStamp,group,groupCollapsed,
 *                       groupEnd,trace,clear,dir,dirxml,count,countReset,cd
 * Safari 6.2.4:         debug,error,log,info,warn,clear,dir,dirxml,table,trace,assert,count,profile,profileEnd,
 *                       time,timeEnd,timeStamp,group,groupCollapsed,groupEnd
 * Opera 28.0.1750.48:   debug,error,info,log,warn,dir,dirxml,table,trace,assert,count,markTimeline,profile,profileEnd,
 *                       time,timeEnd,timeStamp,timeline,timelineEnd,group,groupCollapsed,groupEnd,clear
 *
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/console
 *   - https://stackoverflow.com/q/3326650/5698182
 */
(win => {
    const console = (win.console = win.console || {});
    // Union of Chrome, Firefox, IE, Opera, and Safari console methods
    [
        'assert', 'cd', 'clear', 'count', 'countReset',
        'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed',
        'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd',
        'select', 'table', 'time', 'timeEnd', 'timeStamp', 'timeline',
        'timelineEnd', 'trace', 'warn',
    ]
        // define undefined methods as noop method to prevent errors
        .forEach(m => { console[m] || (console[m] = _.noop); });
})(window);
