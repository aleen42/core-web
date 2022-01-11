/* eslint-disable max-len */
const undefined = [][0]; // eslint-disable-line no-shadow-restricted-names
const noop = () => {};
const identity = x => x;
const constant = x => () => x;
// is null or undefined
const isNullity = x => x == null;
const nonNull = x => x != null;

/**
 * Creates an object that inherits from the `prototype` object and assign with given `properties`.
 *
 * @param {Object | null} proto - The object to inherit from
 * @param {*} [properties]      - The properties to assign to the object
 * @see https://lodash.com/docs/4.17.15#create lodash.create
 */
const create = (proto, ...properties) => assign(Object.create(proto), ...(properties));

const {assign, keys, prototype : OBJECT_PROTO} = Object;
const {isArray, from : arrayFrom} = Array;

// https://stackoverflow.com/questions/18884249/checking-whether-something-is-iterable
const isIterable = obj => nonNull(obj) && !!obj[Symbol.iterator];


const typeOf = x => isNullity(x) ? isNullity : isArray(x) ? isArray : typeOf[OBJECT_PROTO.toString.call(x).slice(8, -1)];
const forToStringTag = tag => (typeOf[tag] = x => typeOf(x) === typeOf[tag]);
const isOBJ = forToStringTag('Object');
const isSTR = forToStringTag('String');
const isNUM = forToStringTag('Number');
// https://stackoverflow.com/questions/7656280/how-do-i-check-whether-an-object-is-an-arguments-object-in-javascript/7656333#7656333
const isARG = forToStringTag('Arguments');
const isFUN = forToStringTag('Function');
const isRE = forToStringTag('RegExp');
const isFormData = forToStringTag('FormData');

const overwrite = (Fn, cb) => {
    function CLS() { return cb(Fn, this, arguments); }
    // Keep the same prototype
    CLS.prototype = Fn.prototype;

    // Keep static methods
    assign(CLS, pickBy(objBy(Object.getOwnPropertyNames(Fn), null, i => {
        try {
            return isFUN(Fn[i]) && Fn[i];
        } catch (e) { return false; }
    })));

    // TODO: fix document when inline `assign`
    return CLS;
};

/**
 * Checks if `value` is a plain object.
 *
 * That is, an object created by the `Object` constructor or one with a `[[Prototype]]` of `null`
 *
 * @see https://lodash.com/docs/4.17.15#isPlainObject lodash.isPlainObject
 */
const isPlain = x => nonNull(x) && Object.getPrototypeOf(x) === OBJECT_PROTO;

/**
 * 检查数组 / Map / Set / Plain Object / String 是否为空.
 *
 * - 注: 和 {@link https://lodash.com/docs/4.17.15#isEmpty lodash.isEmpty} 对比, 除了不支持 array-like 以外,
 *       最重要的区别是对非 object 类型 (如 number) 的处理, 此实现返回 `false`, 而 lodash 返回 `true`
 *
 * @see https://lodash.com/docs/4.17.15#isEmpty lodash.isEmpty
 */
function isEmpty(x) {
    return isNullity(x) || ([isArray, isSTR, isARG].includes(typeOf(x)) ? !x.length
        : isPlain(x) ? !Object.getOwnPropertyNames(x).length
            : isIterable(x) ? x[Symbol.iterator]().next().done
                : false);
}


const splitPath = path => isArray(path) ? path
    : (path && path.split ? path.split('.')
        : (path || path === 0 ? [path] : []));

/**
 * Converts a maybe iterable object to an array.
 *
 * 和 {@link Array.from} 的差别如下
 * - 此方法默认不对数组进行复制, 如果希望复制数组, 可通过第二个参数传入 mapFn=true
 * - 对于 null 和 undefined 的处理, Array.from 会报错, 此方法会返回空数组
 * - 对于 string 的处理, Array.from 会当做 iterable, 此方法会当做基本类型返回一维数组
 * - 其它不支持的类型, Array.from 会返回空数组, 此方法会返回一维数组
 * - 此方法不支持 array-like, 除非该 object 实现了 Iterable, 而 Array.from 支持
 *
 * @param {*}                input
 * @param {boolean|function} [mapFn] `true` 相当于 {@link identity}, 在输入为数组类型时, 强制复制
 * @see Array.from
 * @see https://lodash.com/docs/4.17.15#toArray lodash.toArray
 * @example
 * |                      | this implementation   | lodash             | core                |
 * | input                | _.array(input)        | _.toArray(input)   | Array.from(input)   |
 * | -------------------- | --------------------- | ------------------ | ------------------- |
 * | undefined            | []                    | []                 | TypeError           |
 * | null                 | []                    | []                 | TypeError           |
 * | ''                   | ['']                  | []                 | []                  |
 * | 'abc'                | ['abc']               | ['a', 'b', 'c']    | ['a', 'b', 'c']     |
 * | 0                    | [0]                   | []                 | []                  |
 * | 1                    | [1]                   | []                 | []                  |
 * | NaN                  | [NaN]                 | []                 | []                  |
 * | true                 | [true]                | []                 | []                  |
 * | false                | [false]               | []                 | []                  |
 * | new Set([1, 2])      | [1, 2]                | [1, 2]             | [1, 2]              |
 * | [Arguments] {1, 2}   | [1, 2]                | [1, 2]             | [1, 2]              |
 * | {length:2, 0:1, 1:2} | 不支持 array-like     | [1, 2]             | [1, 2]              |
 */
function toArray(input, mapFn) {
    const checkedMapFn = isFUN(mapFn) ? mapFn : undefined;
    const t = typeOf(input);
    return t === isArray ? (mapFn ? arrayFrom(input, checkedMapFn) : input) // mapFn=true 强制复制数组
        : t !== isSTR && (t === isARG || isIterable(input))
            ? arrayFrom(input, checkedMapFn)
            : nonNull(input) ? (checkedMapFn ? [input].map(checkedMapFn) : [input]) : [];
}

function del(object, props) {
    iterate(isNullity(props) ? keys(object) : toArray(props), key => { delete object[key]; });
}

function withMapThenTest(mapFn, predicateFn, matched) {
    mapFn = iteratee(mapFn);
    predicateFn = iteratee(predicateFn);
    return (value, index, collection) => {
        const mapped = mapFn(value, index, collection);
        if (predicateFn(mapped, index, collection)) return matched(mapped, index);
    };
}

function findFirst(collection, mapFn, predicateFn) {
    let returnValue;
    iterate(collection, withMapThenTest(mapFn, predicateFn, mapped => { $break(returnValue = mapped); }));
    // noinspection JSUnusedAssignment
    return returnValue;
}

function collectAll(collection, mapFn, predicateFn) {
    const returnValue = [];
    iterate(collection, withMapThenTest(mapFn, predicateFn, mapped => { returnValue.push(mapped); }));
    return returnValue;
}

function objBy(collection, mapForKey, mapForValue) {
    mapForKey = iteratee(mapForKey);
    mapForValue = iteratee(mapForValue);
    const returnValue = {};
    iterate(collection, (value, i, c) => { returnValue[mapForKey(value, i, c)] = mapForValue(value, i, c); });
    return returnValue;
}

/**
 * 抽象集合 / 支持使用 {@link iterate} 遍历的对象.
 * @typedef {Array|Iterable|Object} FnIterable
 */

/**
 * 遍历下标.
 * 对于数组或其它 Iterable object (包括 Set), 下标类型为 int;
 * 对于 Object, 下标类型为 string (key);
 * 对于 Map, 下标可以是任何类型 (key).
 * @typedef {int|string|*} FnIterKey
 */

/**
 * 输入用于遍历执行的函数. (返回值应该是 R|undefined, 但会导致 IDEA 出现不必的 type check  警告)
 * @typedef {(function(T, ...): R|*)|string|int|Object|Array} Iteratee<T, R>
 * @template T, R
 */

/**
 * 对数组 / Map / iterable / object 进行遍历.
 *
 * 参考 ES {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols Iteration protocols}
 * 实现同时支持 object 和 Map 的遍历, 遵循和 {@link Map#forEach} 相同的规范
 *
 * 简单对比 {@link https://lodash.com/docs/4.17.15#forEach lodash.forEach} 以及 {@link http://api.jquery.com/jQuery.each/ jQuery.each}, 差别如下:
 * (实现上有区别的地方标注了 * 号)
 * <pre class="lang-markdown">
 * | feature            | _.iter (this implementation)   | lodash.forEach                 | jQuery.each
 * | ------------------ | ------------------------------ | ------------------------------ | ------------------------------
 * | early exit         | * $break()                     | return false                   | return false
 * | iterate object     | YES                            | YES                            | YES
 * | iterate array-like | * NO (as object)               | YES                            | YES
 * | iterate iterable   | * YES                          | NO (as object)                 | NO (as object)
 * | iterate Map        | * YES                          | NO (as object)                 | NO (as object)
 * | inherited property | NO (for..own)                  | NO (for..own)                  | * YES (for..in)
 * | callback arguments | (value, index|key, collection) | (value, index|key, collection) | * (index|key, value, collection)
 * | no callback        | TypeError                      | * noop                         | TypeError
 * | return             | collection                     | collection                     | collection
 * </pre>
 *
 * @param {FnIterable} collection
 * @param {function(T, FnIterKey=, FnIterable=)} callback
 * @template T
 *
 * @see Array#forEach
 * @see Map#forEach
 * @see https://lodash.com/docs/4.17.15#forEach lodash.forEach
 */
function iterate(collection, callback) {
    try {
        if (isArray(collection) || collection instanceof Map) {
            collection.forEach(callback);
        } else if (nonNull(collection)) {
            // iterate with iteration protocol (for..of)
            const simple = isIterable(collection);
            // noinspection JSCheckFunctionSignatures
            const iterator = (simple ? collection : Object.entries(collection))[Symbol.iterator]();
            if (simple) { // iterate for collection
                for (let index = 0; ; index++) {
                    const next = iterator.next();
                    if (next.done) break;
                    callback(next.value, index, collection);
                }
            } else { // iterate for Object entries
                for (; ;) {
                    const next = iterator.next();
                    if (next.done) break;
                    callback(next.value[1]/* entry.value */, next.value[0]/* entry.key */, collection);
                }
            }
        }
    } catch (e) { if (e !== $break) throw e; }
}

const error = msg => { throw new Error(msg); };
const $break = () => { throw $break; };

/**
 * 类似 {@link https://lodash.com/docs/4.17.15#reduce lodash.reduce}, 但遍历的细节不同 (参考 {@link _.iter}).
 *
 * @param {FnIterable} collection
 * @param {function(R, T, FnIterKey=, FnIterable=): *} reducer
 * @param {R} [accumulator] the initial value
 * @return {R} the accumulated value
 * @template T, R
 *
 * @see iterate
 * @see Array#reduce
 * @see https://lodash.com/docs/4.17.15#reduce lodash.reduce
 */
function reduce(collection, reducer, accumulator) {
    let accumulated = arguments.length > 2;
    iterate(collection, (value, index, collection) => {
        accumulator = (accumulated || ((accumulated = 1) & 0)) ? reducer(accumulator, value, index, collection) : value;
    });
    return accumulator;
}

// noinspection CommaExpressionJS
/**
 * 类似 {@link https://lodash.com/docs/4.17.15#property lodash.property}, 返回一个按属性名/下标查找的函数.
 * 但存在以下差异:
 * 1. 参数 `a.b` (dotted path), lodash 的实现不严格, 兼容顶层路径 (多一个 root lookup), 这里的实现统一解释为两层路径.
 * 2. 如果路径为空, lodash 将返回 undefined, 这里的实现则会返回原始 object
 *
 * @param {Array|string|int} path
 * @return {function(*): *}
 *
 * @see https://lodash.com/docs/4.17.15#property lodash.property
 */
const property = path => (path = splitPath(path), object => { // eslint-disable-line no-sequences, no-return-assign
    iterate(path, name => {
        if (nonNull(object)) {
            object = object[name];
        } else {
            object = undefined;
            $break();
        }
    });
    return object;
});

/** @see https://lodash.com/docs/4.17.15#matches lodash.matches */
function matches(source) {
    const props = keys(source);
    return matchesBy(x => pick(x, props), source);
}

/**
 * 当 mapFn 为 string | int 时, 行为和 `lodash.matchesProperty` 一致, 但不支持 `lodash.matchesProperty`
 * 那样使用数组作为 path 寻址, 而是支持广义的 map function (依赖 `iteratee` 的实现)
 * @see https://lodash.com/docs/4.17.15#matchesProperty lodash.matchesProperty
 */
function matchesBy(mapFn, value) {
    mapFn = iteratee(mapFn);
    /** @see https://lodash.com/docs/4.17.15#isEqual lodash.isEqual */
    const equal = require('fast-deep-equal'); // TODO 避免外部依赖
    return x => equal(mapFn(x), value);
}


/**
 * @param [val = identity]
 * @return {function(T, ...): R}
 * @template T, R
 */
function iteratee(val) {
    const t = typeOf(val);
    return isNullity(val) ? identity
        : t === isFUN ? val
            : t === isSTR || t === isNUM ? property(val)
                : t === isOBJ ? matches(val)
                    : t === isArray
                        ? val.length === 2
                            ? isRE(val[0])
                                ? s => `${s}`.replace(val[0], val[1])
                                : matchesBy(val[0], val[1])
                            : error('bad matcher')
                        : t === isRE ? s => `${s}`.match(val)
                            : val(); /* throw TypeError: iteratee is not a function */
}

function pick(object, props) {
    const result = {};
    object && iterate(props, prop => {
        // todo: 和 lodash 实现一致, pick / pickBy / omit / omitBy 应该包含原型链数据
        if (OBJECT_PROTO.hasOwnProperty.call(object, prop)) {
            result[prop] = object[prop];
        }
    });
    return result;
}

function pickBy(object, predicateFn) {
    predicateFn = iteratee(predicateFn);
    const result = {};
    // todo: 和 lodash 实现一致, pick / pickBy / omit / omitBy 应该包含原型链数据
    iterate(object, (value, prop) => {
        if (predicateFn(value, prop)) {
            result[prop] = value;
        }
    });
    return result;
}

/** Creates a function like `_.groupBy`. */
const createAggregator = setter => (collection, mapFn, accumulator = {}) => {
    mapFn = iteratee(mapFn);
    iterate(collection, (value, index) => {
        setter(accumulator, value, mapFn(value, index, collection), collection);
    });
    return accumulator;
};

/**
 * 不同于 `lodash.sum`, 此实现只支持数值相加, undefined 等价于 0.
 * 在 sum 的实现上支持字符串的串接没有任何价值, 字符串的拼接应显式使用 join.
 * @see https://lodash.com/docs/4.17.15#sum lodash.sum
 * @see https://lodash.com/docs/4.17.15#sumBy lodash.sumBy
 */
function sumBy(collection, mapFn) {
    mapFn = iteratee(mapFn);
    return reduce(collection, (result, value, index) => {
        value = mapFn(value, index, collection);
        return result + (isNullity(value) ? 0 : +value);
    }, 0);
}


/**
 * Stop a event or generate a new function which will stop the event
 * @param {Event|function|int} it
 * @param {int|function} [level]
 * @example stop(event)                 // preventDefault & stopPropagation
 * @example stop(event, 0)              // preventDefault
 * @example stop(event, 1)              // stopPropagation
 * @example stop(fn)                    // wrap an event handler with preventDefault & stopPropagation
 * @example stop(0, fn) | _.stop(fn, 0) // wrap an event handler with preventDefault
 * @example stop(1, fn) | _.stop(fn, 1) // wrap an event handler with stopPropagation
 */
function stop(it, level) {
    const t = typeOf(it);
    if (t === isNUM) {
        const fn = isFUN(level) ? level : noop;
        level = it;
        it = fn;
    }
    if (t === isNUM || t === isFUN) {
        // 兼容 Renderable.delegateEvents 框架的回掉格式 callback(action, $target, event) 或 callback($target, action, event)
        return function (event, data, eventInRenderableDelegation) {
            stop(eventInRenderableDelegation || event, level);
            it.call(this, event, data, eventInRenderableDelegation);
        };
    }
    level === 1 || it.preventDefault();  // stop(event, 1) 表示只需 stopPropagation
    level === 0 || it.stopPropagation(); // stop(event, 0) 表示只需 preventDefault
}


const andThen = (fn1, fn2) => function () { return fn2(fn1.apply(this, arguments)); };

/**
 * 返回一个二值化处理函数.
 */
function binarize(fn, trueValue, falseValue) {
    if (arguments.length < 2) {
        trueValue = true;
        falseValue = false;
    }
    return andThen(iteratee(fn), x => x ? trueValue : falseValue);
}

const negate = fn => binarize(fn, false, true);

const map = (collection, mapFn) => collectAll(collection, mapFn, constant(1));
const flatten = array => [].concat(...array);
const flatMap = (collection, mapFn) => flatten(map(collection, mapFn));

const letOf = getFn => (it, ...fn) => getFn(fn.length > 1 ? fn : fn[0])(it);

function makeFun(bindVarargStart) {
    const unscopedThis = this; // it will be `undefined` in strict mode, or else, `globalThis`
    return function (func, arg1, bindThis) {
        const bindArgs = bindVarargStart ? arrayFrom(arguments).slice(bindVarargStart) : arg1 || [];
        const placeHolderIndex = bindArgs.indexOf(_);
        const argLength = bindVarargStart ? bindVarargStart > 1 ? arg1 : undefined : bindArgs.length;
        func = iteratee(func);
        return isNullity(argLength) && isEmpty(bindArgs) ? func : function (it) {
            const thisArg = bindVarargStart ? this : bindThis, isGlobal = isNullity(thisArg) || thisArg === unscopedThis;
            const allArgs = placeHolderIndex < 0
                ? bindArgs.concat(arrayFrom(arguments))
                : [...bindArgs.slice(0, placeHolderIndex), it, ...bindArgs.slice(placeHolderIndex + 1)];
            const args = allArgs.slice(0, argLength), a0 = args[0], a1 = args[1], a2 = args[2];
            // 对 3 个以下参数直接展开 global 调用, 可避免 IE 全局函数及 ActiveXObject 函数没有 Function prototype 的问题, and
            // > call is faster than apply, optimize less than 3 arguments
            // > http://blog.csdn.net/zhengyinhui100/article/details/7837127
            switch (args.length) { // @formatter:off
            case 0: return isGlobal ? func() : func.call(thisArg);
            case 1: return isGlobal ? func(a0) : func.call(thisArg, a0);
            case 2: return isGlobal ? func(a0, a1) : func.call(thisArg, a0, a1);
            case 3: return isGlobal ? func(a0, a1, a2) : func.call(thisArg, a0, a1, a2);
            } // @formatter:on
            return func.apply(thisArg, args);
        };
    };
}

/** @see https://lodash.com/docs/4.17.15#times lodash.times */
function times(n, mapFn) {
    const result = Array(n = +n);
    mapFn = iteratee(mapFn);
    for (let index = -1; ++index < n;) {
        result[index] = mapFn(index);
    }
    return result;
}

/** used by {@link uniqueId} */
let idCounter = 0;

const _ = module.exports = {
    overwrite,

    noop,
    identity,
    nonNull,

    keys,
    assign,
    create,

    array : toArray,
    isArray,
    isPlain,
    isFormData,
    isIterable,
    isEmpty,
    isOBJ,
    isSTR,
    isNUM,
    isFUN,
    isRE,

    iter : iterate,
    reduce,

    /**
     * 为了语义清晰一些, 当 iteratee 是一个 predicate 时建议用 is 代替 {@link #let let}
     * @param {any} it - the context object
     * @param {...} block - the function block / iteratee, witches return value is converted to boolean
     */
    is : binarize(letOf(iteratee)),

    /**
     * Calls the specified function block with context object as its argument and returns its result.
     * 相当于 kotlin 的 `it.let(block)`
     * @param {any} it - the context object
     * @param {...} block - the function block which can be iteratee
     * @see https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/let.html kotlin.let
     */
    let : letOf(iteratee),

    /**
     * 获取属性. 大部分情况下和 `let(it, path)` 等价, 差别在于参数只能用来查找属性而不是 generic function.
     * 尤其是当参数为数组的时, `let` 解释为 {@link matchesBy} 而 `get` 解释为路径
     * @param {any} it - the context object
     * @param {...string | int | (string|int)[]} path - 如果不到 2 个参数, 则第 2 个参数解释为路径 / 下标
     *                                                  如果超过 2 个参数, 则所有参数都解释为下标
     */
    get : letOf(property),

    prop : property,
    biz  : binarize,
    /** @see https://lodash.com/docs/4.17.15#negate */
    not  : negate,

    /**
     * 绑定并固定 this 以及所有参数, 返回无参函数, 此方法不使用 varargs.
     * @param {Iteratee<*, R>} func
     * @param {array} [bindArgs] 绑定的所有参数数组
     * @param {any} [bindThis=globalThis]
     * @return {function(): R}
     * @template R
     */
    fun : makeFun(),

    /**
     * 类似 bind, 但不绑定 this.
     * @param {Iteratee<*, R>} func
     * @param {...} bindArgs
     * @return {function(...): R}
     * @see https://lodash.com/docs/4.17.15#partial lodash.partial
     * @template R
     */
    fn : makeFun(/* bindVarargStart= */1),

    /**
     * 和 {@link https://lodash.com/docs/4.17.15#ary lodash.ary(func, [n=func.length])} 规范一致, 但扩展出来支持参数提前绑定.
     * @param {Iteratee<*, R>} func
     * @param {int} [n=func.length]
     * @return {function(...): R}
     * @template R
     * @example
     *   _.ary(parseInt, 1)('11', 2); // => 11 // 标准用法, 等价于 parseInt('11'),    最后的 2 是多余参数需要丢弃
     *   _.ary(parseInt, 2)('11', 2); // => 3  // 标准用法, 等价于 parseInt('11', 2), 最后的 2 是有效参数
     *   _.ary(parseInt, 1, '11')(2); // => 11 // 扩展用法, 等价于 parseInt('11'),    参数可以提前绑定, 最后的 2 是多余参数需要丢弃
     *   _.ary(parseInt, 2, '11')(2); // => 3  // 扩展用法, 等价于 parseInt('11', 2), 参数可以提前绑定, 最后的 2 是有效参数
     * @see https://lodash.com/docs/4.17.15#ary lodash.ary
     */
    ary : makeFun(/* bindVarargStart= */2),

    // https://stackoverflow.com/questions/3243275/javascript-arrays-checking-for-same-contents-ignoring-order/3244985#3244985
    // 性能是 O(N^2) 暂时不考虑优化 (如果改为排序后比较的话性能是 N * logN)
    isEqUnordered : (arr1, arr2) =>
        (arr1.length === arr2.length) && arr1.every(item => arr2.includes(item)),

    // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates/33121880#33121880
    unique : values => arrayFrom(new Set(values)),

    // https://lodash.com/docs/4.17.15#uniqueId
    uniqueId : prefix => `${prefix || ''}${++idCounter}`,

    /**
     * 等价于 array.map(mapFn).find(predicateFn) (前提是无副作用), 但在查找命中时可以提早结束, 查找没有结果则返回 undefined
     * @param {FnIterable} collection
     * @param {Iteratee<T, R>} mapFn
     * @param {Iteratee<R, boolean>} [predicateFn]
     * @return R|undefined
     * @template T, R
     */
    mapFind : findFirst,

    /** @see Array.find */
    find : (collection, predicateFn) => findFirst(collection, identity, predicateFn),

    /** @see Array.some */
    some : (collection, predicateFn) => !!findFirst(collection, predicateFn),

    /** @see Array.every */
    every : (collection, predicateFn) => !findFirst(collection, negate(predicateFn)),

    /**
     * @param {FnIterable} collection
     * @param {Iteratee<T, R>} mapFn
     * @return {Array<R>}
     * @template T, R
     * @see https://lodash.com/docs/4.17.15#map lodash.map
     */
    map,

    /**
     * @see https://lodash.com/docs/4.17.15#mapValues lodash.mapValues
     */
    mapValues : (collections, mapFn) => objBy(collections, (value, index) => index, mapFn),

    /**
     * 类似 `lodash.keyBy`, 但多了第 3 个参数, 可指定 value 取值.
     *
     * @param {FnIterable} collection
     * @param {Iteratee<T, R>} mapForKey
     * @param {Iteratee<T, R>} [mapForValue = identity]
     * @return {Object}
     * @see https://lodash.com/docs/4.17.15#keyBy lodash.keyBy
     */
    objBy,

    /**
     * 等价于 map(collection, mapFn).filter(predicateFn), 但允许忽略 predicateFn, 也就是说默认只包含 truthy 的结果
     * @param {FnIterable} collection
     * @param {Iteratee<T, R>} mapFn
     * @param {Iteratee<R, boolean>} [predicateFn]
     * @return {Array<R>}
     * @template T, R
     */
    mapFilter : collectAll,

    /** 忽略第二个参数时, 和 lodash 的 {@link https://lodash.com/docs/4.17.15#compact _.compact} 行为一致 */
    filter : (collection, predicateFn) => collectAll(collection, identity, predicateFn),

    // https://lodash.com/docs/4.17.15#difference
    difference(array, values) {
        values = new Set(toArray(values));
        return array.filter(f => !values.has(f));
    },

    /**
     * @param {Array<T>|null|undefined} array
     * @param {Iteratee<T, boolean>} [predicateFn]
     * @return {Array<T>}
     * @template T
     * @see https://lodash.com/docs/4.17.15#remove
     */
    remove(array, predicateFn) {
        predicateFn = iteratee(predicateFn);
        const removed = [];
        for (let index = 0, length = array && array.length; index < length; index++) {
            const adjustedIndex = index - removed.length;
            const value = array[adjustedIndex];
            if (predicateFn(value, index, array)) {
                array.splice(adjustedIndex, 1);
                removed.push(value);
            }
        }
        return removed;
    },

    // https://stackoverflow.com/questions/30610523/reverse-array-in-javascript-without-mutating-original-array
    reversed : values => toArray(values, true).reverse(),

    // https://lodash.com/docs/4.17.15#last
    last : array => array ? array.at(-1) : undefined,

    /** @see https://lodash.com/docs/4.17.15#flatten lodash.flatten */
    flatten,
    /** @see https://lodash.com/docs/4.17.15#flatMap lodash.flatMap */
    flatMap,

    stop,

    // https://lodash.com/docs/4.17.15#once
    once : func => {
        let result, callTime = 0;
        return function () {
            return callTime++ ? result : (result = func.apply(this, arguments));
        };
    },

    /**
     * 简单的属性提取, 暂不支持 paths.
     * @see https://lodash.com/docs/4.17.15#pick lodash.pick
     */
    pick,

    /**
     * The opposite of pick (暂不支持 paths).
     * @see https://lodash.com/docs/4.17.15#omit lodash.omit
     */
    omit : (object, keys) => {
        // todo: 和 lodash 实现一致, pick / pickBy / omit / omitBy 应该包含原型链数据
        const result = assign({}, object);
        del(result, toArray(keys));
        return result;
    },

    /**
     * 和 `lodash.pickBy` 类似, 从 object 中提取满足条件的属性组成新的 object,
     * 但由于是使用 _.iter 而不是 Object.entries 遍历, 与 `lodash.each` 会存在一些差异,
     * 比如 source object 为 Map 的时候会枚举到 map 的 key, 以下列举部分运行结果参考
     * <pre class="lang-markdown">
     * |                                                                | 本实现           | lodash.pickBy
     * | -------------------------------------------------------------- | ---------------- | -----------------
     * | _.pickBy({0:'a', 1:'b', 2:'c'},                v => v !== 'b') | {0: "a", 2: "c"} | {0: "a", 2: "c"}
     * | _.pickBy(['a', 'b', 'c'],                      v => v !== 'b') | {0: "a", 2: "c"} | {0: "a", 2: "c"}
     * | _.pickBy('abc',                                v => v !== 'b') | {0: "a", 2: "c"} | {0: "a", 2: "c"}
     * | _.pickBy(new Map([[0,'a'], [1,'b'], [2,'c']]), v => v !== 'b') | {0: "a", 2: "c"} | {}
     * </pre>
     *
     * @param {*} object - The source object.
     * @param {function(*, FnIterKey=)} [predicateFn = identity] - invoked per property with two arguments: (value, key).
     * @see https://lodash.com/docs/4.17.15#pickBy lodash.pickBy
     */
    pickBy,

    /**
     * 删除所有 / 部分属性.
     * @param {Object | Array} object - The operand target
     * @param {string | string[] | any | any[]} [keys]
     */
    del,

    /**
     * 重新赋值.
     * @param {Object} target - The target object
     * @param {*}      source - The properties to assign to the object
     */
    reassign(target, source) {
        del(target);
        assign(target, source);
    },

    /**
     * @see https://lodash.com/docs/4.17.15#groupBy lodash.groupBy
     */
    groupBy : createAggregator((result, value, index) => { (result[index] = (result[index] || [])).push(value); }),

    /**
     * @see https://lodash.com/docs/4.17.15#countBy lodash.countBy
     */
    countBy : createAggregator((result, value, index) => { result[index] = (result[index] || 0) + 1; }),

    sumBy,
    sum : collection => sumBy(collection/*, identity */),

    /**
     * @see https://lodash.com/docs/4.17.15#escapeRegExp lodash.escapeRegExp
     * @see https://github.com/lodash/lodash/blob/4.17.15-npm/escapeRegExp.js source
     * @see https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript for more discussions
     */
    escapeRegExp : string => isNullity(string) ? '' : `${string}`.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'),

    times,

    /** @see https://lodash.com/docs/4.17.15#upperFirst lodash.upperFirst */
    upperFirst : s => s.charAt(0).toUpperCase() + s.slice(1),
};

// `window._` for eliminate exported warnings, which has defined by webpack.ProvidePlugin
typeof window !== 'undefined' && (window._ = _);
