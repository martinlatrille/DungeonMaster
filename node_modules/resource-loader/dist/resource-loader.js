(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Loader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _miniSignals = require('mini-signals');

var _miniSignals2 = _interopRequireDefault(_miniSignals);

var _parseUri = require('parse-uri');

var _parseUri2 = _interopRequireDefault(_parseUri);

var _async = require('./async');

var async = _interopRequireWildcard(_async);

var _Resource = require('./Resource');

var _Resource2 = _interopRequireDefault(_Resource);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// some constants
var MAX_PROGRESS = 100;
var rgxExtractUrlHash = /(#[\w-]+)?$/;

/**
 * Manages the state and loading of multiple resources to load.
 *
 * @class
 */

var Loader = function () {
    /**
     * @param {string} [baseUrl=''] - The base url for all resources loaded by this loader.
     * @param {number} [concurrency=10] - The number of resources to load concurrently.
     */
    function Loader() {
        var _this = this;

        var baseUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var concurrency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

        _classCallCheck(this, Loader);

        /**
         * The base url for all resources loaded by this loader.
         *
         * @member {string}
         */
        this.baseUrl = baseUrl;

        /**
         * The progress percent of the loader going through the queue.
         *
         * @member {number}
         */
        this.progress = 0;

        /**
         * Loading state of the loader, true if it is currently loading resources.
         *
         * @member {boolean}
         */
        this.loading = false;

        /**
         * A querystring to append to every URL added to the loader.
         *
         * This should be a valid query string *without* the question-mark (`?`). The loader will
         * also *not* escape values for you. Make sure to escape your parameters with
         * [`encodeURIComponent`](https://mdn.io/encodeURIComponent) before assigning this property.
         *
         * @example
         *
         * ```js
         * const loader = new Loader();
         *
         * loader.defaultQueryString = 'user=me&password=secret';
         *
         * // This will request 'image.png?user=me&password=secret'
         * loader.add('image.png').load();
         *
         * loader.reset();
         *
         * // This will request 'image.png?v=1&user=me&password=secret'
         * loader.add('iamge.png?v=1').load();
         * ```
         */
        this.defaultQueryString = '';

        /**
         * The middleware to run before loading each resource.
         *
         * @member {function[]}
         */
        this._beforeMiddleware = [];

        /**
         * The middleware to run after loading each resource.
         *
         * @member {function[]}
         */
        this._afterMiddleware = [];

        /**
         * The tracks the resources we are currently completing parsing for.
         *
         * @member {Resource[]}
         */
        this._resourcesParsing = [];

        /**
         * The `_loadResource` function bound with this object context.
         *
         * @private
         * @member {function}
         * @param {Resource} r - The resource to load
         * @param {Function} d - The dequeue function
         * @return {undefined}
         */
        this._boundLoadResource = function (r, d) {
            return _this._loadResource(r, d);
        };

        /**
         * The resources waiting to be loaded.
         *
         * @private
         * @member {Resource[]}
         */
        this._queue = async.queue(this._boundLoadResource, concurrency);

        this._queue.pause();

        /**
         * All the resources for this loader keyed by name.
         *
         * @member {object<string, Resource>}
         */
        this.resources = {};

        /**
         * Dispatched once per loaded or errored resource.
         *
         * The callback looks like {@link Loader.OnProgressSignal}.
         *
         * @member {Signal}
         */
        this.onProgress = new _miniSignals2.default();

        /**
         * Dispatched once per errored resource.
         *
         * The callback looks like {@link Loader.OnErrorSignal}.
         *
         * @member {Signal}
         */
        this.onError = new _miniSignals2.default();

        /**
         * Dispatched once per loaded resource.
         *
         * The callback looks like {@link Loader.OnLoadSignal}.
         *
         * @member {Signal}
         */
        this.onLoad = new _miniSignals2.default();

        /**
         * Dispatched when the loader begins to process the queue.
         *
         * The callback looks like {@link Loader.OnStartSignal}.
         *
         * @member {Signal}
         */
        this.onStart = new _miniSignals2.default();

        /**
         * Dispatched when the queued resources all load.
         *
         * The callback looks like {@link Loader.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onComplete = new _miniSignals2.default();

        /**
         * When the progress changes the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnProgressSignal
         * @param {Loader} loader - The loader the progress is advancing on.
         * @param {Resource} resource - The resource that has completed or failed to cause the progress to advance.
         */

        /**
         * When an error occurrs the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnErrorSignal
         * @param {Loader} loader - The loader the error happened in.
         * @param {Resource} resource - The resource that caused the error.
         */

        /**
         * When a load completes the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnLoadSignal
         * @param {Loader} loader - The loader that laoded the resource.
         * @param {Resource} resource - The resource that has completed loading.
         */

        /**
         * When the loader starts loading resources it dispatches this callback.
         *
         * @memberof Loader
         * @callback OnStartSignal
         * @param {Loader} loader - The loader that has started loading resources.
         */

        /**
         * When the loader completes loading resources it dispatches this callback.
         *
         * @memberof Loader
         * @callback OnCompleteSignal
         * @param {Loader} loader - The loader that has finished loading resources.
         */
    }

    /**
     * Adds a resource (or multiple resources) to the loader queue.
     *
     * This function can take a wide variety of different parameters. The only thing that is always
     * required the url to load. All the following will work:
     *
     * ```js
     * loader
     *     // normal param syntax
     *     .add('key', 'http://...', function () {})
     *     .add('http://...', function () {})
     *     .add('http://...')
     *
     *     // object syntax
     *     .add({
     *         name: 'key2',
     *         url: 'http://...'
     *     }, function () {})
     *     .add({
     *         url: 'http://...'
     *     }, function () {})
     *     .add({
     *         name: 'key3',
     *         url: 'http://...'
     *         onComplete: function () {}
     *     })
     *     .add({
     *         url: 'https://...',
     *         onComplete: function () {},
     *         crossOrigin: true
     *     })
     *
     *     // you can also pass an array of objects or urls or both
     *     .add([
     *         { name: 'key4', url: 'http://...', onComplete: function () {} },
     *         { url: 'http://...', onComplete: function () {} },
     *         'http://...'
     *     ])
     *
     *     // and you can use both params and options
     *     .add('key', 'http://...', { crossOrigin: true }, function () {})
     *     .add('http://...', { crossOrigin: true }, function () {});
     * ```
     *
     * @param {string} [name] - The name of the resource to load, if not passed the url is used.
     * @param {string} [url] - The url for this resource, relative to the baseUrl of this loader.
     * @param {object} [options] - The options for the load.
     * @param {boolean} [options.crossOrigin] - Is this request cross-origin? Default is to determine automatically.
     * @param {Resource.LOAD_TYPE} [options.loadType=Resource.LOAD_TYPE.XHR] - How should this resource be loaded?
     * @param {Resource.XHR_RESPONSE_TYPE} [options.xhrType=Resource.XHR_RESPONSE_TYPE.DEFAULT] - How should
     *      the data being loaded be interpreted when using XHR?
     * @param {object} [options.metadata] - Extra configuration for middleware and the Resource object.
     * @param {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [options.metadata.loadElement=null] - The
     *      element to use for loading, instead of creating one.
     * @param {boolean} [options.metadata.skipSource=false] - Skips adding source(s) to the load element. This
     *      is useful if you want to pass in a `loadElement` that you already added load sources to.
     * @param {function} [cb] - Function to call when this specific resource completes loading.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.add = function add(name, url, options, cb) {
        // special case of an array of objects or urls
        if (Array.isArray(name)) {
            for (var i = 0; i < name.length; ++i) {
                this.add(name[i]);
            }

            return this;
        }

        // if an object is passed instead of params
        if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
            cb = url || name.callback || name.onComplete;
            options = name;
            url = name.url;
            name = name.name || name.key || name.url;
        }

        // case where no name is passed shift all args over by one.
        if (typeof url !== 'string') {
            cb = options;
            options = url;
            url = name;
        }

        // now that we shifted make sure we have a proper url.
        if (typeof url !== 'string') {
            throw new Error('No url passed to add resource to loader.');
        }

        // options are optional so people might pass a function and no options
        if (typeof options === 'function') {
            cb = options;
            options = null;
        }

        // if loading already you can only add resources that have a parent.
        if (this.loading && (!options || !options.parentResource)) {
            throw new Error('Cannot add resources while the loader is running.');
        }

        // check if resource already exists.
        if (this.resources[name]) {
            throw new Error('Resource named "' + name + '" already exists.');
        }

        // add base url if this isn't an absolute url
        url = this._prepareUrl(url);

        // create the store the resource
        this.resources[name] = new _Resource2.default(name, url, options);

        if (typeof cb === 'function') {
            this.resources[name].onAfterMiddleware.once(cb);
        }

        // if actively loading, make sure to adjust progress chunks for that parent and its children
        if (this.loading) {
            var parent = options.parentResource;
            var incompleteChildren = [];

            for (var _i = 0; _i < parent.children.length; ++_i) {
                if (!parent.children[_i].isComplete) {
                    incompleteChildren.push(parent.children[_i]);
                }
            }

            var fullChunk = parent.progressChunk * (incompleteChildren.length + 1); // +1 for parent
            var eachChunk = fullChunk / (incompleteChildren.length + 2); // +2 for parent & new child

            parent.children.push(this.resources[name]);
            parent.progressChunk = eachChunk;

            for (var _i2 = 0; _i2 < incompleteChildren.length; ++_i2) {
                incompleteChildren[_i2].progressChunk = eachChunk;
            }
        }

        // add the resource to the queue
        this._queue.push(this.resources[name]);

        return this;
    };

    /**
     * Sets up a middleware function that will run *before* the
     * resource is loaded.
     *
     * @method before
     * @param {function} fn - The middleware function to register.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.pre = function pre(fn) {
        this._beforeMiddleware.push(fn);

        return this;
    };

    /**
     * Sets up a middleware function that will run *after* the
     * resource is loaded.
     *
     * @alias use
     * @method after
     * @param {function} fn - The middleware function to register.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.use = function use(fn) {
        this._afterMiddleware.push(fn);

        return this;
    };

    /**
     * Resets the queue of the loader to prepare for a new load.
     *
     * @return {Loader} Returns itself.
     */


    Loader.prototype.reset = function reset() {
        this.progress = 0;
        this.loading = false;

        this._queue.kill();
        this._queue.pause();

        // abort all resource loads
        for (var k in this.resources) {
            var res = this.resources[k];

            if (res._onLoadBinding) {
                res._onLoadBinding.detach();
            }

            if (res.isLoading) {
                res.abort();
            }
        }

        this.resources = {};

        return this;
    };

    /**
     * Starts loading the queued resources.
     *
     * @param {function} [cb] - Optional callback that will be bound to the `complete` event.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.load = function load(cb) {
        // register complete callback if they pass one
        if (typeof cb === 'function') {
            this.onComplete.once(cb);
        }

        // if the queue has already started we are done here
        if (this.loading) {
            return this;
        }

        // distribute progress chunks
        var chunk = 100 / this._queue._tasks.length;

        for (var i = 0; i < this._queue._tasks.length; ++i) {
            this._queue._tasks[i].data.progressChunk = chunk;
        }

        // update loading state
        this.loading = true;

        // notify of start
        this.onStart.dispatch(this);

        // start loading
        this._queue.resume();

        return this;
    };

    /**
     * Prepares a url for usage based on the configuration of this object
     *
     * @private
     * @param {string} url - The url to prepare.
     * @return {string} The prepared url.
     */


    Loader.prototype._prepareUrl = function _prepareUrl(url) {
        var parsedUrl = (0, _parseUri2.default)(url, { strictMode: true });
        var result = void 0;

        // absolute url, just use it as is.
        if (parsedUrl.protocol || !parsedUrl.path || url.indexOf('//') === 0) {
            result = url;
        }
        // if baseUrl doesn't end in slash and url doesn't start with slash, then add a slash inbetween
        else if (this.baseUrl.length && this.baseUrl.lastIndexOf('/') !== this.baseUrl.length - 1 && url.charAt(0) !== '/') {
                result = this.baseUrl + '/' + url;
            } else {
                result = this.baseUrl + url;
            }

        // if we need to add a default querystring, there is a bit more work
        if (this.defaultQueryString) {
            var hash = rgxExtractUrlHash.exec(result)[0];

            result = result.substr(0, result.length - hash.length);

            if (result.indexOf('?') !== -1) {
                result += '&' + this.defaultQueryString;
            } else {
                result += '?' + this.defaultQueryString;
            }

            result += hash;
        }

        return result;
    };

    /**
     * Loads a single resource.
     *
     * @private
     * @param {Resource} resource - The resource to load.
     * @param {function} dequeue - The function to call when we need to dequeue this item.
     */


    Loader.prototype._loadResource = function _loadResource(resource, dequeue) {
        var _this2 = this;

        resource._dequeue = dequeue;

        // run before middleware
        async.eachSeries(this._beforeMiddleware, function (fn, next) {
            fn.call(_this2, resource, function () {
                // if the before middleware marks the resource as complete,
                // break and don't process any more before middleware
                next(resource.isComplete ? {} : null);
            });
        }, function () {
            if (resource.isComplete) {
                _this2._onLoad(resource);
            } else {
                resource._onLoadBinding = resource.onComplete.once(_this2._onLoad, _this2);
                resource.load();
            }
        });
    };

    /**
     * Called once each resource has loaded.
     *
     * @private
     */


    Loader.prototype._onComplete = function _onComplete() {
        this.loading = false;

        this.onComplete.dispatch(this, this.resources);
    };

    /**
     * Called each time a resources is loaded.
     *
     * @private
     * @param {Resource} resource - The resource that was loaded
     */


    Loader.prototype._onLoad = function _onLoad(resource) {
        var _this3 = this;

        resource._onLoadBinding = null;

        // remove this resource from the async queue, and add it to our list of resources that are being parsed
        resource._dequeue();
        this._resourcesParsing.push(resource);

        // run middleware, this *must* happen before dequeue so sub-assets get added properly
        async.eachSeries(this._afterMiddleware, function (fn, next) {
            fn.call(_this3, resource, next);
        }, function () {
            resource.onAfterMiddleware.dispatch(resource);

            _this3.progress += resource.progressChunk;
            _this3.onProgress.dispatch(_this3, resource);

            if (resource.error) {
                _this3.onError.dispatch(resource.error, _this3, resource);
            } else {
                _this3.onLoad.dispatch(_this3, resource);
            }

            _this3._resourcesParsing.splice(_this3._resourcesParsing.indexOf(resource), 1);

            // do completion check
            if (_this3._queue.idle() && _this3._resourcesParsing.length === 0) {
                _this3.progress = MAX_PROGRESS;
                _this3._onComplete();
            }
        });
    };

    return Loader;
}();

exports.default = Loader;

},{"./Resource":2,"./async":3,"mini-signals":6,"parse-uri":7}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parseUri = require('parse-uri');

var _parseUri2 = _interopRequireDefault(_parseUri);

var _miniSignals = require('mini-signals');

var _miniSignals2 = _interopRequireDefault(_miniSignals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// tests is CORS is supported in XHR, if not we need to use XDR
var useXdr = !!(window.XDomainRequest && !('withCredentials' in new XMLHttpRequest()));
var tempAnchor = null;

// some status constants
var STATUS_NONE = 0;
var STATUS_OK = 200;
var STATUS_EMPTY = 204;

// noop
function _noop() {} /* empty */

/**
 * Manages the state and loading of a resource and all child resources.
 *
 * @class
 */

var Resource = function () {
    /**
     * Sets the load type to be used for a specific extension.
     *
     * @static
     * @param {string} extname - The extension to set the type for, e.g. "png" or "fnt"
     * @param {Resource.LOAD_TYPE} loadType - The load type to set it to.
     */
    Resource.setExtensionLoadType = function setExtensionLoadType(extname, loadType) {
        setExtMap(Resource._loadTypeMap, extname, loadType);
    };

    /**
     * Sets the load type to be used for a specific extension.
     *
     * @static
     * @param {string} extname - The extension to set the type for, e.g. "png" or "fnt"
     * @param {Resource.XHR_RESPONSE_TYPE} xhrType - The xhr type to set it to.
     */


    Resource.setExtensionXhrType = function setExtensionXhrType(extname, xhrType) {
        setExtMap(Resource._xhrTypeMap, extname, xhrType);
    };

    /**
     * @param {string} name - The name of the resource to load.
     * @param {string|string[]} url - The url for this resource, for audio/video loads you can pass
     *      an array of sources.
     * @param {object} [options] - The options for the load.
     * @param {string|boolean} [options.crossOrigin] - Is this request cross-origin? Default is to
     *      determine automatically.
     * @param {Resource.LOAD_TYPE} [options.loadType=Resource.LOAD_TYPE.XHR] - How should this resource
     *      be loaded?
     * @param {Resource.XHR_RESPONSE_TYPE} [options.xhrType=Resource.XHR_RESPONSE_TYPE.DEFAULT] - How
     *      should the data being loaded be interpreted when using XHR?
     * @param {object} [options.metadata] - Extra configuration for middleware and the Resource object.
     * @param {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [options.metadata.loadElement=null] - The
     *      element to use for loading, instead of creating one.
     * @param {boolean} [options.metadata.skipSource=false] - Skips adding source(s) to the load element. This
     *      is useful if you want to pass in a `loadElement` that you already added load sources to.
     */


    function Resource(name, url, options) {
        _classCallCheck(this, Resource);

        if (typeof name !== 'string' || typeof url !== 'string') {
            throw new Error('Both name and url are required for constructing a resource.');
        }

        options = options || {};

        /**
         * The state flags of this resource.
         *
         * @member {number}
         */
        this._flags = 0;

        // set data url flag, needs to be set early for some _determineX checks to work.
        this._setFlag(Resource.STATUS_FLAGS.DATA_URL, url.indexOf('data:') === 0);

        /**
         * The name of this resource.
         *
         * @member {string}
         * @readonly
         */
        this.name = name;

        /**
         * The url used to load this resource.
         *
         * @member {string}
         * @readonly
         */
        this.url = url;

        /**
         * The data that was loaded by the resource.
         *
         * @member {any}
         */
        this.data = null;

        /**
         * Is this request cross-origin? If unset, determined automatically.
         *
         * @member {string}
         */
        this.crossOrigin = options.crossOrigin === true ? 'anonymous' : options.crossOrigin;

        /**
         * The method of loading to use for this resource.
         *
         * @member {Resource.LOAD_TYPE}
         */
        this.loadType = options.loadType || this._determineLoadType();

        /**
         * The type used to load the resource via XHR. If unset, determined automatically.
         *
         * @member {string}
         */
        this.xhrType = options.xhrType;

        /**
         * Extra info for middleware, and controlling specifics about how the resource loads.
         *
         * Note that if you pass in a `loadElement`, the Resource class takes ownership of it.
         * Meaning it will modify it as it sees fit.
         *
         * @member {object}
         * @property {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [loadElement=null] - The
         *  element to use for loading, instead of creating one.
         * @property {boolean} [skipSource=false] - Skips adding source(s) to the load element. This
         *  is useful if you want to pass in a `loadElement` that you already added load sources
         *  to.
         */
        this.metadata = options.metadata || {};

        /**
         * The error that occurred while loading (if any).
         *
         * @member {Error}
         * @readonly
         */
        this.error = null;

        /**
         * The XHR object that was used to load this resource. This is only set
         * when `loadType` is `Resource.LOAD_TYPE.XHR`.
         *
         * @member {XMLHttpRequest}
         * @readonly
         */
        this.xhr = null;

        /**
         * The child resources this resource owns.
         *
         * @member {Resource[]}
         * @readonly
         */
        this.children = [];

        /**
         * The resource type.
         *
         * @member {Resource.TYPE}
         * @readonly
         */
        this.type = Resource.TYPE.UNKNOWN;

        /**
         * The progress chunk owned by this resource.
         *
         * @member {number}
         * @readonly
         */
        this.progressChunk = 0;

        /**
         * The `dequeue` method that will be used a storage place for the async queue dequeue method
         * used privately by the loader.
         *
         * @private
         * @member {function}
         */
        this._dequeue = _noop;

        /**
         * Used a storage place for the on load binding used privately by the loader.
         *
         * @private
         * @member {function}
         */
        this._onLoadBinding = null;

        /**
         * The `complete` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundComplete = this.complete.bind(this);

        /**
         * The `_onError` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundOnError = this._onError.bind(this);

        /**
         * The `_onProgress` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundOnProgress = this._onProgress.bind(this);

        // xhr callbacks
        this._boundXhrOnError = this._xhrOnError.bind(this);
        this._boundXhrOnAbort = this._xhrOnAbort.bind(this);
        this._boundXhrOnLoad = this._xhrOnLoad.bind(this);
        this._boundXdrOnTimeout = this._xdrOnTimeout.bind(this);

        /**
         * Dispatched when the resource beings to load.
         *
         * The callback looks like {@link Resource.OnStartSignal}.
         *
         * @member {Signal}
         */
        this.onStart = new _miniSignals2.default();

        /**
         * Dispatched each time progress of this resource load updates.
         * Not all resources types and loader systems can support this event
         * so sometimes it may not be available. If the resource
         * is being loaded on a modern browser, using XHR, and the remote server
         * properly sets Content-Length headers, then this will be available.
         *
         * The callback looks like {@link Resource.OnProgressSignal}.
         *
         * @member {Signal}
         */
        this.onProgress = new _miniSignals2.default();

        /**
         * Dispatched once this resource has loaded, if there was an error it will
         * be in the `error` property.
         *
         * The callback looks like {@link Resource.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onComplete = new _miniSignals2.default();

        /**
         * Dispatched after this resource has had all the *after* middleware run on it.
         *
         * The callback looks like {@link Resource.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onAfterMiddleware = new _miniSignals2.default();

        /**
         * When the resource starts to load.
         *
         * @memberof Resource
         * @callback OnStartSignal
         * @param {Resource} resource - The resource that the event happened on.
         */

        /**
         * When the resource reports loading progress.
         *
         * @memberof Resource
         * @callback OnProgressSignal
         * @param {Resource} resource - The resource that the event happened on.
         * @param {number} percentage - The progress of the load in the range [0, 1].
         */

        /**
         * When the resource finishes loading.
         *
         * @memberof Resource
         * @callback OnCompleteSignal
         * @param {Resource} resource - The resource that the event happened on.
         */
    }

    /**
     * Stores whether or not this url is a data url.
     *
     * @member {boolean}
     * @readonly
     */


    /**
     * Marks the resource as complete.
     *
     */
    Resource.prototype.complete = function complete() {
        // TODO: Clean this up in a wrapper or something...gross....
        if (this.data && this.data.removeEventListener) {
            this.data.removeEventListener('error', this._boundOnError, false);
            this.data.removeEventListener('load', this._boundComplete, false);
            this.data.removeEventListener('progress', this._boundOnProgress, false);
            this.data.removeEventListener('canplaythrough', this._boundComplete, false);
        }

        if (this.xhr) {
            if (this.xhr.removeEventListener) {
                this.xhr.removeEventListener('error', this._boundXhrOnError, false);
                this.xhr.removeEventListener('abort', this._boundXhrOnAbort, false);
                this.xhr.removeEventListener('progress', this._boundOnProgress, false);
                this.xhr.removeEventListener('load', this._boundXhrOnLoad, false);
            } else {
                this.xhr.onerror = null;
                this.xhr.ontimeout = null;
                this.xhr.onprogress = null;
                this.xhr.onload = null;
            }
        }

        if (this.isComplete) {
            throw new Error('Complete called again for an already completed resource.');
        }

        this._setFlag(Resource.STATUS_FLAGS.COMPLETE, true);
        this._setFlag(Resource.STATUS_FLAGS.LOADING, false);

        this.onComplete.dispatch(this);
    };

    /**
     * Aborts the loading of this resource, with an optional message.
     *
     * @param {string} message - The message to use for the error
     */


    Resource.prototype.abort = function abort(message) {
        // abort can be called multiple times, ignore subsequent calls.
        if (this.error) {
            return;
        }

        // store error
        this.error = new Error(message);

        // abort the actual loading
        if (this.xhr) {
            this.xhr.abort();
        } else if (this.xdr) {
            this.xdr.abort();
        } else if (this.data) {
            // single source
            if (this.data.src) {
                this.data.src = Resource.EMPTY_GIF;
            }
            // multi-source
            else {
                    while (this.data.firstChild) {
                        this.data.removeChild(this.data.firstChild);
                    }
                }
        }

        // done now.
        this.complete();
    };

    /**
     * Kicks off loading of this resource. This method is asynchronous.
     *
     * @param {function} [cb] - Optional callback to call once the resource is loaded.
     */


    Resource.prototype.load = function load(cb) {
        var _this = this;

        if (this.isLoading) {
            return;
        }

        if (this.isComplete) {
            if (cb) {
                setTimeout(function () {
                    return cb(_this);
                }, 1);
            }

            return;
        } else if (cb) {
            this.onComplete.once(cb);
        }

        this._setFlag(Resource.STATUS_FLAGS.LOADING, true);

        this.onStart.dispatch(this);

        // if unset, determine the value
        if (this.crossOrigin === false || typeof this.crossOrigin !== 'string') {
            this.crossOrigin = this._determineCrossOrigin(this.url);
        }

        switch (this.loadType) {
            case Resource.LOAD_TYPE.IMAGE:
                this.type = Resource.TYPE.IMAGE;
                this._loadElement('image');
                break;

            case Resource.LOAD_TYPE.AUDIO:
                this.type = Resource.TYPE.AUDIO;
                this._loadSourceElement('audio');
                break;

            case Resource.LOAD_TYPE.VIDEO:
                this.type = Resource.TYPE.VIDEO;
                this._loadSourceElement('video');
                break;

            case Resource.LOAD_TYPE.XHR:
            /* falls through */
            default:
                if (useXdr && this.crossOrigin) {
                    this._loadXdr();
                } else {
                    this._loadXhr();
                }
                break;
        }
    };

    /**
     * Checks if the flag is set.
     *
     * @private
     * @param {number} flag - The flag to check.
     * @return {boolean} True if the flag is set.
     */


    Resource.prototype._hasFlag = function _hasFlag(flag) {
        return !!(this._flags & flag);
    };

    /**
     * (Un)Sets the flag.
     *
     * @private
     * @param {number} flag - The flag to (un)set.
     * @param {boolean} value - Whether to set or (un)set the flag.
     */


    Resource.prototype._setFlag = function _setFlag(flag, value) {
        this._flags = value ? this._flags | flag : this._flags & ~flag;
    };

    /**
     * Loads this resources using an element that has a single source,
     * like an HTMLImageElement.
     *
     * @private
     * @param {string} type - The type of element to use.
     */


    Resource.prototype._loadElement = function _loadElement(type) {
        if (this.metadata.loadElement) {
            this.data = this.metadata.loadElement;
        } else if (type === 'image' && typeof window.Image !== 'undefined') {
            this.data = new Image();
        } else {
            this.data = document.createElement(type);
        }

        if (this.crossOrigin) {
            this.data.crossOrigin = this.crossOrigin;
        }

        if (!this.metadata.skipSource) {
            this.data.src = this.url;
        }

        this.data.addEventListener('error', this._boundOnError, false);
        this.data.addEventListener('load', this._boundComplete, false);
        this.data.addEventListener('progress', this._boundOnProgress, false);
    };

    /**
     * Loads this resources using an element that has multiple sources,
     * like an HTMLAudioElement or HTMLVideoElement.
     *
     * @private
     * @param {string} type - The type of element to use.
     */


    Resource.prototype._loadSourceElement = function _loadSourceElement(type) {
        if (this.metadata.loadElement) {
            this.data = this.metadata.loadElement;
        } else if (type === 'audio' && typeof window.Audio !== 'undefined') {
            this.data = new Audio();
        } else {
            this.data = document.createElement(type);
        }

        if (this.data === null) {
            this.abort('Unsupported element: ' + type);

            return;
        }

        if (!this.metadata.skipSource) {
            // support for CocoonJS Canvas+ runtime, lacks document.createElement('source')
            if (navigator.isCocoonJS) {
                this.data.src = Array.isArray(this.url) ? this.url[0] : this.url;
            } else if (Array.isArray(this.url)) {
                for (var i = 0; i < this.url.length; ++i) {
                    this.data.appendChild(this._createSource(type, this.url[i]));
                }
            } else {
                this.data.appendChild(this._createSource(type, this.url));
            }
        }

        this.data.addEventListener('error', this._boundOnError, false);
        this.data.addEventListener('load', this._boundComplete, false);
        this.data.addEventListener('progress', this._boundOnProgress, false);
        this.data.addEventListener('canplaythrough', this._boundComplete, false);

        this.data.load();
    };

    /**
     * Loads this resources using an XMLHttpRequest.
     *
     * @private
     */


    Resource.prototype._loadXhr = function _loadXhr() {
        // if unset, determine the value
        if (typeof this.xhrType !== 'string') {
            this.xhrType = this._determineXhrType();
        }

        var xhr = this.xhr = new XMLHttpRequest();

        // set the request type and url
        xhr.open('GET', this.url, true);

        // load json as text and parse it ourselves. We do this because some browsers
        // *cough* safari *cough* can't deal with it.
        if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON || this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
            xhr.responseType = Resource.XHR_RESPONSE_TYPE.TEXT;
        } else {
            xhr.responseType = this.xhrType;
        }

        xhr.addEventListener('error', this._boundXhrOnError, false);
        xhr.addEventListener('abort', this._boundXhrOnAbort, false);
        xhr.addEventListener('progress', this._boundOnProgress, false);
        xhr.addEventListener('load', this._boundXhrOnLoad, false);

        xhr.send();
    };

    /**
     * Loads this resources using an XDomainRequest. This is here because we need to support IE9 (gross).
     *
     * @private
     */


    Resource.prototype._loadXdr = function _loadXdr() {
        // if unset, determine the value
        if (typeof this.xhrType !== 'string') {
            this.xhrType = this._determineXhrType();
        }

        var xdr = this.xhr = new XDomainRequest();

        // XDomainRequest has a few quirks. Occasionally it will abort requests
        // A way to avoid this is to make sure ALL callbacks are set even if not used
        // More info here: http://stackoverflow.com/questions/15786966/xdomainrequest-aborts-post-on-ie-9
        xdr.timeout = 5000;

        xdr.onerror = this._boundXhrOnError;
        xdr.ontimeout = this._boundXdrOnTimeout;
        xdr.onprogress = this._boundOnProgress;
        xdr.onload = this._boundXhrOnLoad;

        xdr.open('GET', this.url, true);

        // Note: The xdr.send() call is wrapped in a timeout to prevent an
        // issue with the interface where some requests are lost if multiple
        // XDomainRequests are being sent at the same time.
        // Some info here: https://github.com/photonstorm/phaser/issues/1248
        setTimeout(function () {
            return xdr.send();
        }, 1);
    };

    /**
     * Creates a source used in loading via an element.
     *
     * @private
     * @param {string} type - The element type (video or audio).
     * @param {string} url - The source URL to load from.
     * @param {string} [mime] - The mime type of the video
     * @return {HTMLSourceElement} The source element.
     */


    Resource.prototype._createSource = function _createSource(type, url, mime) {
        if (!mime) {
            mime = type + '/' + url.substr(url.lastIndexOf('.') + 1);
        }

        var source = document.createElement('source');

        source.src = url;
        source.type = mime;

        return source;
    };

    /**
     * Called if a load errors out.
     *
     * @param {Event} event - The error event from the element that emits it.
     * @private
     */


    Resource.prototype._onError = function _onError(event) {
        this.abort('Failed to load element using: ' + event.target.nodeName);
    };

    /**
     * Called if a load progress event fires for xhr/xdr.
     *
     * @private
     * @param {XMLHttpRequestProgressEvent|Event} event - Progress event.
     */


    Resource.prototype._onProgress = function _onProgress(event) {
        if (event && event.lengthComputable) {
            this.onProgress.dispatch(this, event.loaded / event.total);
        }
    };

    /**
     * Called if an error event fires for xhr/xdr.
     *
     * @private
     * @param {XMLHttpRequestErrorEvent|Event} event - Error event.
     */


    Resource.prototype._xhrOnError = function _xhrOnError() {
        var xhr = this.xhr;

        this.abort(reqType(xhr) + ' Request failed. Status: ' + xhr.status + ', text: "' + xhr.statusText + '"');
    };

    /**
     * Called if an abort event fires for xhr.
     *
     * @private
     * @param {XMLHttpRequestAbortEvent} event - Abort Event
     */


    Resource.prototype._xhrOnAbort = function _xhrOnAbort() {
        this.abort(reqType(this.xhr) + ' Request was aborted by the user.');
    };

    /**
     * Called if a timeout event fires for xdr.
     *
     * @private
     * @param {Event} event - Timeout event.
     */


    Resource.prototype._xdrOnTimeout = function _xdrOnTimeout() {
        this.abort(reqType(this.xhr) + ' Request timed out.');
    };

    /**
     * Called when data successfully loads from an xhr/xdr request.
     *
     * @private
     * @param {XMLHttpRequestLoadEvent|Event} event - Load event
     */


    Resource.prototype._xhrOnLoad = function _xhrOnLoad() {
        var xhr = this.xhr;
        var status = typeof xhr.status === 'undefined' ? xhr.status : STATUS_OK; // XDR has no `.status`, assume 200.

        // status can be 0 when using the `file://` protocol so we also check if a response is set
        if (status === STATUS_OK || status === STATUS_EMPTY || status === STATUS_NONE && xhr.responseText.length > 0) {
            // if text, just return it
            if (this.xhrType === Resource.XHR_RESPONSE_TYPE.TEXT) {
                this.data = xhr.responseText;
                this.type = Resource.TYPE.TEXT;
            }
            // if json, parse into json object
            else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON) {
                    try {
                        this.data = JSON.parse(xhr.responseText);
                        this.type = Resource.TYPE.JSON;
                    } catch (e) {
                        this.abort('Error trying to parse loaded json: ' + e);

                        return;
                    }
                }
                // if xml, parse into an xml document or div element
                else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
                        try {
                            if (window.DOMParser) {
                                var domparser = new DOMParser();

                                this.data = domparser.parseFromString(xhr.responseText, 'text/xml');
                            } else {
                                var div = document.createElement('div');

                                div.innerHTML = xhr.responseText;

                                this.data = div;
                            }

                            this.type = Resource.TYPE.XML;
                        } catch (e) {
                            this.abort('Error trying to parse loaded xml: ' + e);

                            return;
                        }
                    }
                    // other types just return the response
                    else {
                            this.data = xhr.response || xhr.responseText;
                        }
        } else {
            this.abort('[' + xhr.status + '] ' + xhr.statusText + ': ' + xhr.responseURL);

            return;
        }

        this.complete();
    };

    /**
     * Sets the `crossOrigin` property for this resource based on if the url
     * for this resource is cross-origin. If crossOrigin was manually set, this
     * function does nothing.
     *
     * @private
     * @param {string} url - The url to test.
     * @param {object} [loc=window.location] - The location object to test against.
     * @return {string} The crossOrigin value to use (or empty string for none).
     */


    Resource.prototype._determineCrossOrigin = function _determineCrossOrigin(url, loc) {
        // data: and javascript: urls are considered same-origin
        if (url.indexOf('data:') === 0) {
            return '';
        }

        // default is window.location
        loc = loc || window.location;

        if (!tempAnchor) {
            tempAnchor = document.createElement('a');
        }

        // let the browser determine the full href for the url of this resource and then
        // parse with the node url lib, we can't use the properties of the anchor element
        // because they don't work in IE9 :(
        tempAnchor.href = url;
        url = (0, _parseUri2.default)(tempAnchor.href, { strictMode: true });

        var samePort = !url.port && loc.port === '' || url.port === loc.port;
        var protocol = url.protocol ? url.protocol + ':' : '';

        // if cross origin
        if (url.host !== loc.hostname || !samePort || protocol !== loc.protocol) {
            return 'anonymous';
        }

        return '';
    };

    /**
     * Determines the responseType of an XHR request based on the extension of the
     * resource being loaded.
     *
     * @private
     * @return {Resource.XHR_RESPONSE_TYPE} The responseType to use.
     */


    Resource.prototype._determineXhrType = function _determineXhrType() {
        return Resource._xhrTypeMap[this._getExtension()] || Resource.XHR_RESPONSE_TYPE.TEXT;
    };

    /**
     * Determines the loadType of a resource based on the extension of the
     * resource being loaded.
     *
     * @private
     * @return {Resource.LOAD_TYPE} The loadType to use.
     */


    Resource.prototype._determineLoadType = function _determineLoadType() {
        return Resource._loadTypeMap[this._getExtension()] || Resource.LOAD_TYPE.XHR;
    };

    /**
     * Extracts the extension (sans '.') of the file being loaded by the resource.
     *
     * @private
     * @return {string} The extension.
     */


    Resource.prototype._getExtension = function _getExtension() {
        var url = this.url;
        var ext = '';

        if (this.isDataUrl) {
            var slashIndex = url.indexOf('/');

            ext = url.substring(slashIndex + 1, url.indexOf(';', slashIndex));
        } else {
            var queryStart = url.indexOf('?');

            if (queryStart !== -1) {
                url = url.substring(0, queryStart);
            }

            ext = url.substring(url.lastIndexOf('.') + 1);
        }

        return ext.toLowerCase();
    };

    /**
     * Determines the mime type of an XHR request based on the responseType of
     * resource being loaded.
     *
     * @private
     * @param {Resource.XHR_RESPONSE_TYPE} type - The type to get a mime type for.
     * @return {string} The mime type to use.
     */


    Resource.prototype._getMimeFromXhrType = function _getMimeFromXhrType(type) {
        switch (type) {
            case Resource.XHR_RESPONSE_TYPE.BUFFER:
                return 'application/octet-binary';

            case Resource.XHR_RESPONSE_TYPE.BLOB:
                return 'application/blob';

            case Resource.XHR_RESPONSE_TYPE.DOCUMENT:
                return 'application/xml';

            case Resource.XHR_RESPONSE_TYPE.JSON:
                return 'application/json';

            case Resource.XHR_RESPONSE_TYPE.DEFAULT:
            case Resource.XHR_RESPONSE_TYPE.TEXT:
            /* falls through */
            default:
                return 'text/plain';

        }
    };

    _createClass(Resource, [{
        key: 'isDataUrl',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.DATA_URL);
        }

        /**
         * Describes if this resource has finished loading. Is true when the resource has completely
         * loaded.
         *
         * @member {boolean}
         * @readonly
         */

    }, {
        key: 'isComplete',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.COMPLETE);
        }

        /**
         * Describes if this resource is currently loading. Is true when the resource starts loading,
         * and is false again when complete.
         *
         * @member {boolean}
         * @readonly
         */

    }, {
        key: 'isLoading',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.LOADING);
        }
    }]);

    return Resource;
}();

/**
 * The types of resources a resource could represent.
 *
 * @static
 * @readonly
 * @enum {number}
 */


exports.default = Resource;
Resource.STATUS_FLAGS = {
    NONE: 0,
    DATA_URL: 1 << 0,
    COMPLETE: 1 << 1,
    LOADING: 1 << 2
};

/**
 * The types of resources a resource could represent.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.TYPE = {
    UNKNOWN: 0,
    JSON: 1,
    XML: 2,
    IMAGE: 3,
    AUDIO: 4,
    VIDEO: 5,
    TEXT: 6
};

/**
 * The types of loading a resource can use.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.LOAD_TYPE = {
    /** Uses XMLHttpRequest to load the resource. */
    XHR: 1,
    /** Uses an `Image` object to load the resource. */
    IMAGE: 2,
    /** Uses an `Audio` object to load the resource. */
    AUDIO: 3,
    /** Uses a `Video` object to load the resource. */
    VIDEO: 4
};

/**
 * The XHR ready states, used internally.
 *
 * @static
 * @readonly
 * @enum {string}
 */
Resource.XHR_RESPONSE_TYPE = {
    /** string */
    DEFAULT: 'text',
    /** ArrayBuffer */
    BUFFER: 'arraybuffer',
    /** Blob */
    BLOB: 'blob',
    /** Document */
    DOCUMENT: 'document',
    /** Object */
    JSON: 'json',
    /** String */
    TEXT: 'text'
};

Resource._loadTypeMap = {
    // images
    gif: Resource.LOAD_TYPE.IMAGE,
    png: Resource.LOAD_TYPE.IMAGE,
    bmp: Resource.LOAD_TYPE.IMAGE,
    jpg: Resource.LOAD_TYPE.IMAGE,
    jpeg: Resource.LOAD_TYPE.IMAGE,
    tif: Resource.LOAD_TYPE.IMAGE,
    tiff: Resource.LOAD_TYPE.IMAGE,
    webp: Resource.LOAD_TYPE.IMAGE,
    tga: Resource.LOAD_TYPE.IMAGE,
    svg: Resource.LOAD_TYPE.IMAGE,
    'svg+xml': Resource.LOAD_TYPE.IMAGE, // for SVG data urls

    // audio
    mp3: Resource.LOAD_TYPE.AUDIO,
    ogg: Resource.LOAD_TYPE.AUDIO,
    wav: Resource.LOAD_TYPE.AUDIO,

    // videos
    mp4: Resource.LOAD_TYPE.VIDEO,
    webm: Resource.LOAD_TYPE.VIDEO
};

Resource._xhrTypeMap = {
    // xml
    xhtml: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    html: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    htm: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    xml: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    tmx: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    svg: Resource.XHR_RESPONSE_TYPE.DOCUMENT,

    // This was added to handle Tiled Tileset XML, but .tsx is also a TypeScript React Component.
    // Since it is way less likely for people to be loading TypeScript files instead of Tiled files,
    // this should probably be fine.
    tsx: Resource.XHR_RESPONSE_TYPE.DOCUMENT,

    // images
    gif: Resource.XHR_RESPONSE_TYPE.BLOB,
    png: Resource.XHR_RESPONSE_TYPE.BLOB,
    bmp: Resource.XHR_RESPONSE_TYPE.BLOB,
    jpg: Resource.XHR_RESPONSE_TYPE.BLOB,
    jpeg: Resource.XHR_RESPONSE_TYPE.BLOB,
    tif: Resource.XHR_RESPONSE_TYPE.BLOB,
    tiff: Resource.XHR_RESPONSE_TYPE.BLOB,
    webp: Resource.XHR_RESPONSE_TYPE.BLOB,
    tga: Resource.XHR_RESPONSE_TYPE.BLOB,

    // json
    json: Resource.XHR_RESPONSE_TYPE.JSON,

    // text
    text: Resource.XHR_RESPONSE_TYPE.TEXT,
    txt: Resource.XHR_RESPONSE_TYPE.TEXT,

    // fonts
    ttf: Resource.XHR_RESPONSE_TYPE.BUFFER,
    otf: Resource.XHR_RESPONSE_TYPE.BUFFER
};

// We can't set the `src` attribute to empty string, so on abort we set it to this 1px transparent gif
Resource.EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

/**
 * Quick helper to set a value on one of the extension maps. Ensures there is no
 * dot at the start of the extension.
 *
 * @ignore
 * @param {object} map - The map to set on.
 * @param {string} extname - The extension (or key) to set.
 * @param {number} val - The value to set.
 */
function setExtMap(map, extname, val) {
    if (extname && extname.indexOf('.') === 0) {
        extname = extname.substring(1);
    }

    if (!extname) {
        return;
    }

    map[extname] = val;
}

/**
 * Quick helper to get string xhr type.
 *
 * @ignore
 * @param {XMLHttpRequest|XDomainRequest} xhr - The request to check.
 * @return {string} The type.
 */
function reqType(xhr) {
    return xhr.toString().replace('object ', '');
}

},{"mini-signals":6,"parse-uri":7}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.eachSeries = eachSeries;
exports.queue = queue;
/**
 * Smaller version of the async library constructs.
 *
 */
function _noop() {} /* empty */

/**
 * Iterates an array in series.
 *
 * @param {*[]} array - Array to iterate.
 * @param {function} iterator - Function to call for each element.
 * @param {function} callback - Function to call when done, or on error.
 */
function eachSeries(array, iterator, callback) {
    var i = 0;
    var len = array.length;

    (function next(err) {
        if (err || i === len) {
            if (callback) {
                callback(err);
            }

            return;
        }

        iterator(array[i++], next);
    })();
}

/**
 * Ensures a function is only called once.
 *
 * @param {function} fn - The function to wrap.
 * @return {function} The wrapping function.
 */
function onlyOnce(fn) {
    return function onceWrapper() {
        if (fn === null) {
            throw new Error('Callback was already called.');
        }

        var callFn = fn;

        fn = null;
        callFn.apply(this, arguments);
    };
}

/**
 * Async queue implementation,
 *
 * @param {function} worker - The worker function to call for each task.
 * @param {number} concurrency - How many workers to run in parrallel.
 * @return {*} The async queue object.
 */
function queue(worker, concurrency) {
    if (concurrency == null) {
        // eslint-disable-line no-eq-null,eqeqeq
        concurrency = 1;
    } else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero');
    }

    var workers = 0;
    var q = {
        _tasks: [],
        concurrency: concurrency,
        saturated: _noop,
        unsaturated: _noop,
        buffer: concurrency / 4,
        empty: _noop,
        drain: _noop,
        error: _noop,
        started: false,
        paused: false,
        push: function push(data, callback) {
            _insert(data, false, callback);
        },
        kill: function kill() {
            workers = 0;
            q.drain = _noop;
            q.started = false;
            q._tasks = [];
        },
        unshift: function unshift(data, callback) {
            _insert(data, true, callback);
        },
        process: function process() {
            while (!q.paused && workers < q.concurrency && q._tasks.length) {
                var task = q._tasks.shift();

                if (q._tasks.length === 0) {
                    q.empty();
                }

                workers += 1;

                if (workers === q.concurrency) {
                    q.saturated();
                }

                worker(task.data, onlyOnce(_next(task)));
            }
        },
        length: function length() {
            return q._tasks.length;
        },
        running: function running() {
            return workers;
        },
        idle: function idle() {
            return q._tasks.length + workers === 0;
        },
        pause: function pause() {
            if (q.paused === true) {
                return;
            }

            q.paused = true;
        },
        resume: function resume() {
            if (q.paused === false) {
                return;
            }

            q.paused = false;

            // Need to call q.process once per concurrent
            // worker to preserve full concurrency after pause
            for (var w = 1; w <= q.concurrency; w++) {
                q.process();
            }
        }
    };

    function _insert(data, insertAtFront, callback) {
        if (callback != null && typeof callback !== 'function') {
            // eslint-disable-line no-eq-null,eqeqeq
            throw new Error('task callback must be a function');
        }

        q.started = true;

        if (data == null && q.idle()) {
            // eslint-disable-line no-eq-null,eqeqeq
            // call drain immediately if there are no tasks
            setTimeout(function () {
                return q.drain();
            }, 1);

            return;
        }

        var item = {
            data: data,
            callback: typeof callback === 'function' ? callback : _noop
        };

        if (insertAtFront) {
            q._tasks.unshift(item);
        } else {
            q._tasks.push(item);
        }

        setTimeout(function () {
            return q.process();
        }, 1);
    }

    function _next(task) {
        return function next() {
            workers -= 1;

            task.callback.apply(task, arguments);

            if (arguments[0] != null) {
                // eslint-disable-line no-eq-null,eqeqeq
                q.error(arguments[0], task.data);
            }

            if (workers <= q.concurrency - q.buffer) {
                q.unsaturated();
            }

            if (q.idle()) {
                q.drain();
            }

            q.process();
        };
    }

    return q;
}

},{}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.encodeBinary = encodeBinary;
var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function encodeBinary(input) {
    var output = '';
    var inx = 0;

    while (inx < input.length) {
        // Fill byte buffer array
        var bytebuffer = [0, 0, 0];
        var encodedCharIndexes = [0, 0, 0, 0];

        for (var jnx = 0; jnx < bytebuffer.length; ++jnx) {
            if (inx < input.length) {
                // throw away high-order byte, as documented at:
                // https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
                bytebuffer[jnx] = input.charCodeAt(inx++) & 0xff;
            } else {
                bytebuffer[jnx] = 0;
            }
        }

        // Get each encoded character, 6 bits at a time
        // index 1: first 6 bits
        encodedCharIndexes[0] = bytebuffer[0] >> 2;

        // index 2: second 6 bits (2 least significant bits from input byte 1 + 4 most significant bits from byte 2)
        encodedCharIndexes[1] = (bytebuffer[0] & 0x3) << 4 | bytebuffer[1] >> 4;

        // index 3: third 6 bits (4 least significant bits from input byte 2 + 2 most significant bits from byte 3)
        encodedCharIndexes[2] = (bytebuffer[1] & 0x0f) << 2 | bytebuffer[2] >> 6;

        // index 3: forth 6 bits (6 least significant bits from input byte 3)
        encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

        // Determine whether padding happened, and adjust accordingly
        var paddingBytes = inx - (input.length - 1);

        switch (paddingBytes) {
            case 2:
                // Set last 2 characters to padding char
                encodedCharIndexes[3] = 64;
                encodedCharIndexes[2] = 64;
                break;

            case 1:
                // Set last character to padding char
                encodedCharIndexes[3] = 64;
                break;

            default:
                break; // No padding - proceed
        }

        // Now we will grab each appropriate character out of our keystring
        // based on our index array and append it to the output string
        for (var _jnx = 0; _jnx < encodedCharIndexes.length; ++_jnx) {
            output += _keyStr.charAt(encodedCharIndexes[_jnx]);
        }
    }

    return output;
}

},{}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _Loader = require('./Loader');

var _Loader2 = _interopRequireDefault(_Loader);

var _Resource = require('./Resource');

var _Resource2 = _interopRequireDefault(_Resource);

var _async = require('./async');

var async = _interopRequireWildcard(_async);

var _b = require('./b64');

var b64 = _interopRequireWildcard(_b);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Loader2.default.Resource = _Resource2.default;
_Loader2.default.async = async;
_Loader2.default.base64 = b64;

// export manually, and also as default
module.exports = _Loader2.default; // eslint-disable-line no-undef
exports.default = _Loader2.default;

},{"./Loader":1,"./Resource":2,"./async":3,"./b64":4}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var MiniSignalBinding = (function () {
  function MiniSignalBinding(fn, once, thisArg) {
    if (once === undefined) once = false;

    _classCallCheck(this, MiniSignalBinding);

    this._fn = fn;
    this._once = once;
    this._thisArg = thisArg;
    this._next = this._prev = this._owner = null;
  }

  _createClass(MiniSignalBinding, [{
    key: 'detach',
    value: function detach() {
      if (this._owner === null) return false;
      this._owner.detach(this);
      return true;
    }
  }]);

  return MiniSignalBinding;
})();

function _addMiniSignalBinding(self, node) {
  if (!self._head) {
    self._head = node;
    self._tail = node;
  } else {
    self._tail._next = node;
    node._prev = self._tail;
    self._tail = node;
  }

  node._owner = self;

  return node;
}

var MiniSignal = (function () {
  function MiniSignal() {
    _classCallCheck(this, MiniSignal);

    this._head = this._tail = undefined;
  }

  _createClass(MiniSignal, [{
    key: 'handlers',
    value: function handlers() {
      var exists = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      var node = this._head;

      if (exists) return !!node;

      var ee = [];

      while (node) {
        ee.push(node);
        node = node._next;
      }

      return ee;
    }
  }, {
    key: 'has',
    value: function has(node) {
      if (!(node instanceof MiniSignalBinding)) {
        throw new Error('MiniSignal#has(): First arg must be a MiniSignalBinding object.');
      }

      return node._owner === this;
    }
  }, {
    key: 'dispatch',
    value: function dispatch() {
      var node = this._head;

      if (!node) return false;

      while (node) {
        if (node._once) this.detach(node);
        node._fn.apply(node._thisArg, arguments);
        node = node._next;
      }

      return true;
    }
  }, {
    key: 'add',
    value: function add(fn) {
      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (typeof fn !== 'function') {
        throw new Error('MiniSignal#add(): First arg must be a Function.');
      }
      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, false, thisArg));
    }
  }, {
    key: 'once',
    value: function once(fn) {
      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (typeof fn !== 'function') {
        throw new Error('MiniSignal#once(): First arg must be a Function.');
      }
      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, true, thisArg));
    }
  }, {
    key: 'detach',
    value: function detach(node) {
      if (!(node instanceof MiniSignalBinding)) {
        throw new Error('MiniSignal#detach(): First arg must be a MiniSignalBinding object.');
      }
      if (node._owner !== this) return this;

      if (node._prev) node._prev._next = node._next;
      if (node._next) node._next._prev = node._prev;

      if (node === this._head) {
        this._head = node._next;
        if (node._next === null) {
          this._tail = null;
        }
      } else if (node === this._tail) {
        this._tail = node._prev;
        this._tail._next = null;
      }

      node._owner = null;
      return this;
    }
  }, {
    key: 'detachAll',
    value: function detachAll() {
      var node = this._head;
      if (!node) return this;

      this._head = this._tail = null;

      while (node) {
        node._owner = null;
        node = node._next;
      }
      return this;
    }
  }]);

  return MiniSignal;
})();

MiniSignal.MiniSignalBinding = MiniSignalBinding;

exports['default'] = MiniSignal;
module.exports = exports['default'];

},{}],7:[function(require,module,exports){
'use strict'

module.exports = function parseURI (str, opts) {
  opts = opts || {}

  var o = {
    key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  }

  var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str)
  var uri = {}
  var i = 14

  while (i--) uri[o.key[i]] = m[i] || ''

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}

},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTG9hZGVyLmpzIiwibGliL1Jlc291cmNlLmpzIiwibGliL2FzeW5jLmpzIiwibGliL2I2NC5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9taW5pLXNpZ25hbHMvbGliL21pbmktc2lnbmFscy5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS11cmkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDem1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDam1DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbnZhciBfbWluaVNpZ25hbHMgPSByZXF1aXJlKCdtaW5pLXNpZ25hbHMnKTtcblxudmFyIF9taW5pU2lnbmFsczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9taW5pU2lnbmFscyk7XG5cbnZhciBfcGFyc2VVcmkgPSByZXF1aXJlKCdwYXJzZS11cmknKTtcblxudmFyIF9wYXJzZVVyaTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wYXJzZVVyaSk7XG5cbnZhciBfYXN5bmMgPSByZXF1aXJlKCcuL2FzeW5jJyk7XG5cbnZhciBhc3luYyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9hc3luYyk7XG5cbnZhciBfUmVzb3VyY2UgPSByZXF1aXJlKCcuL1Jlc291cmNlJyk7XG5cbnZhciBfUmVzb3VyY2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUmVzb3VyY2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vLyBzb21lIGNvbnN0YW50c1xudmFyIE1BWF9QUk9HUkVTUyA9IDEwMDtcbnZhciByZ3hFeHRyYWN0VXJsSGFzaCA9IC8oI1tcXHctXSspPyQvO1xuXG4vKipcbiAqIE1hbmFnZXMgdGhlIHN0YXRlIGFuZCBsb2FkaW5nIG9mIG11bHRpcGxlIHJlc291cmNlcyB0byBsb2FkLlxuICpcbiAqIEBjbGFzc1xuICovXG5cbnZhciBMb2FkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtiYXNlVXJsPScnXSAtIFRoZSBiYXNlIHVybCBmb3IgYWxsIHJlc291cmNlcyBsb2FkZWQgYnkgdGhpcyBsb2FkZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25jdXJyZW5jeT0xMF0gLSBUaGUgbnVtYmVyIG9mIHJlc291cmNlcyB0byBsb2FkIGNvbmN1cnJlbnRseS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBMb2FkZXIoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGJhc2VVcmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICcnO1xuICAgICAgICB2YXIgY29uY3VycmVuY3kgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IDEwO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2FkZXIpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYmFzZSB1cmwgZm9yIGFsbCByZXNvdXJjZXMgbG9hZGVkIGJ5IHRoaXMgbG9hZGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSBiYXNlVXJsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvZ3Jlc3MgcGVyY2VudCBvZiB0aGUgbG9hZGVyIGdvaW5nIHRocm91Z2ggdGhlIHF1ZXVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9hZGluZyBzdGF0ZSBvZiB0aGUgbG9hZGVyLCB0cnVlIGlmIGl0IGlzIGN1cnJlbnRseSBsb2FkaW5nIHJlc291cmNlcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHF1ZXJ5c3RyaW5nIHRvIGFwcGVuZCB0byBldmVyeSBVUkwgYWRkZWQgdG8gdGhlIGxvYWRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBzaG91bGQgYmUgYSB2YWxpZCBxdWVyeSBzdHJpbmcgKndpdGhvdXQqIHRoZSBxdWVzdGlvbi1tYXJrIChgP2ApLiBUaGUgbG9hZGVyIHdpbGxcbiAgICAgICAgICogYWxzbyAqbm90KiBlc2NhcGUgdmFsdWVzIGZvciB5b3UuIE1ha2Ugc3VyZSB0byBlc2NhcGUgeW91ciBwYXJhbWV0ZXJzIHdpdGhcbiAgICAgICAgICogW2BlbmNvZGVVUklDb21wb25lbnRgXShodHRwczovL21kbi5pby9lbmNvZGVVUklDb21wb25lbnQpIGJlZm9yZSBhc3NpZ25pbmcgdGhpcyBwcm9wZXJ0eS5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogYGBganNcbiAgICAgICAgICogY29uc3QgbG9hZGVyID0gbmV3IExvYWRlcigpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBsb2FkZXIuZGVmYXVsdFF1ZXJ5U3RyaW5nID0gJ3VzZXI9bWUmcGFzc3dvcmQ9c2VjcmV0JztcbiAgICAgICAgICpcbiAgICAgICAgICogLy8gVGhpcyB3aWxsIHJlcXVlc3QgJ2ltYWdlLnBuZz91c2VyPW1lJnBhc3N3b3JkPXNlY3JldCdcbiAgICAgICAgICogbG9hZGVyLmFkZCgnaW1hZ2UucG5nJykubG9hZCgpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBsb2FkZXIucmVzZXQoKTtcbiAgICAgICAgICpcbiAgICAgICAgICogLy8gVGhpcyB3aWxsIHJlcXVlc3QgJ2ltYWdlLnBuZz92PTEmdXNlcj1tZSZwYXNzd29yZD1zZWNyZXQnXG4gICAgICAgICAqIGxvYWRlci5hZGQoJ2lhbWdlLnBuZz92PTEnKS5sb2FkKCk7XG4gICAgICAgICAqIGBgYFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWZhdWx0UXVlcnlTdHJpbmcgPSAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1pZGRsZXdhcmUgdG8gcnVuIGJlZm9yZSBsb2FkaW5nIGVhY2ggcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9uW119XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9iZWZvcmVNaWRkbGV3YXJlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBtaWRkbGV3YXJlIHRvIHJ1biBhZnRlciBsb2FkaW5nIGVhY2ggcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9uW119XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hZnRlck1pZGRsZXdhcmUgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYWNrcyB0aGUgcmVzb3VyY2VzIHdlIGFyZSBjdXJyZW50bHkgY29tcGxldGluZyBwYXJzaW5nIGZvci5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7UmVzb3VyY2VbXX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3Jlc291cmNlc1BhcnNpbmcgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBfbG9hZFJlc291cmNlYCBmdW5jdGlvbiBib3VuZCB3aXRoIHRoaXMgb2JqZWN0IGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByIC0gVGhlIHJlc291cmNlIHRvIGxvYWRcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZCAtIFRoZSBkZXF1ZXVlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JvdW5kTG9hZFJlc291cmNlID0gZnVuY3Rpb24gKHIsIGQpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fbG9hZFJlc291cmNlKHIsIGQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcmVzb3VyY2VzIHdhaXRpbmcgdG8gYmUgbG9hZGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWVtYmVyIHtSZXNvdXJjZVtdfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWUgPSBhc3luYy5xdWV1ZSh0aGlzLl9ib3VuZExvYWRSZXNvdXJjZSwgY29uY3VycmVuY3kpO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnBhdXNlKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGlzIGxvYWRlciBrZXllZCBieSBuYW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtvYmplY3Q8c3RyaW5nLCBSZXNvdXJjZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIG9uY2UgcGVyIGxvYWRlZCBvciBlcnJvcmVkIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2FsbGJhY2sgbG9va3MgbGlrZSB7QGxpbmsgTG9hZGVyLk9uUHJvZ3Jlc3NTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uUHJvZ3Jlc3MgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgb25jZSBwZXIgZXJyb3JlZCByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkVycm9yU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkVycm9yID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIG9uY2UgcGVyIGxvYWRlZCByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkxvYWRTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uTG9hZCA9IG5ldyBfbWluaVNpZ25hbHMyLmRlZmF1bHQoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2hlZCB3aGVuIHRoZSBsb2FkZXIgYmVnaW5zIHRvIHByb2Nlc3MgdGhlIHF1ZXVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2FsbGJhY2sgbG9va3MgbGlrZSB7QGxpbmsgTG9hZGVyLk9uU3RhcnRTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uU3RhcnQgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgd2hlbiB0aGUgcXVldWVkIHJlc291cmNlcyBhbGwgbG9hZC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkNvbXBsZXRlU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIHRoZSBwcm9ncmVzcyBjaGFuZ2VzIHRoZSBsb2FkZXIgYW5kIHJlc291cmNlIGFyZSBkaXNhcHRjaGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgTG9hZGVyXG4gICAgICAgICAqIEBjYWxsYmFjayBPblByb2dyZXNzU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7TG9hZGVyfSBsb2FkZXIgLSBUaGUgbG9hZGVyIHRoZSBwcm9ncmVzcyBpcyBhZHZhbmNpbmcgb24uXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgaGFzIGNvbXBsZXRlZCBvciBmYWlsZWQgdG8gY2F1c2UgdGhlIHByb2dyZXNzIHRvIGFkdmFuY2UuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIGFuIGVycm9yIG9jY3VycnMgdGhlIGxvYWRlciBhbmQgcmVzb3VyY2UgYXJlIGRpc2FwdGNoZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uRXJyb3JTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtMb2FkZXJ9IGxvYWRlciAtIFRoZSBsb2FkZXIgdGhlIGVycm9yIGhhcHBlbmVkIGluLlxuICAgICAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSAtIFRoZSByZXNvdXJjZSB0aGF0IGNhdXNlZCB0aGUgZXJyb3IuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIGEgbG9hZCBjb21wbGV0ZXMgdGhlIGxvYWRlciBhbmQgcmVzb3VyY2UgYXJlIGRpc2FwdGNoZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uTG9hZFNpZ25hbFxuICAgICAgICAgKiBAcGFyYW0ge0xvYWRlcn0gbG9hZGVyIC0gVGhlIGxvYWRlciB0aGF0IGxhb2RlZCB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgaGFzIGNvbXBsZXRlZCBsb2FkaW5nLlxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgbG9hZGVyIHN0YXJ0cyBsb2FkaW5nIHJlc291cmNlcyBpdCBkaXNwYXRjaGVzIHRoaXMgY2FsbGJhY2suXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uU3RhcnRTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtMb2FkZXJ9IGxvYWRlciAtIFRoZSBsb2FkZXIgdGhhdCBoYXMgc3RhcnRlZCBsb2FkaW5nIHJlc291cmNlcy5cbiAgICAgICAgICovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZW4gdGhlIGxvYWRlciBjb21wbGV0ZXMgbG9hZGluZyByZXNvdXJjZXMgaXQgZGlzcGF0Y2hlcyB0aGlzIGNhbGxiYWNrLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgTG9hZGVyXG4gICAgICAgICAqIEBjYWxsYmFjayBPbkNvbXBsZXRlU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7TG9hZGVyfSBsb2FkZXIgLSBUaGUgbG9hZGVyIHRoYXQgaGFzIGZpbmlzaGVkIGxvYWRpbmcgcmVzb3VyY2VzLlxuICAgICAgICAgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgcmVzb3VyY2UgKG9yIG11bHRpcGxlIHJlc291cmNlcykgdG8gdGhlIGxvYWRlciBxdWV1ZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gY2FuIHRha2UgYSB3aWRlIHZhcmlldHkgb2YgZGlmZmVyZW50IHBhcmFtZXRlcnMuIFRoZSBvbmx5IHRoaW5nIHRoYXQgaXMgYWx3YXlzXG4gICAgICogcmVxdWlyZWQgdGhlIHVybCB0byBsb2FkLiBBbGwgdGhlIGZvbGxvd2luZyB3aWxsIHdvcms6XG4gICAgICpcbiAgICAgKiBgYGBqc1xuICAgICAqIGxvYWRlclxuICAgICAqICAgICAvLyBub3JtYWwgcGFyYW0gc3ludGF4XG4gICAgICogICAgIC5hZGQoJ2tleScsICdodHRwOi8vLi4uJywgZnVuY3Rpb24gKCkge30pXG4gICAgICogICAgIC5hZGQoJ2h0dHA6Ly8uLi4nLCBmdW5jdGlvbiAoKSB7fSlcbiAgICAgKiAgICAgLmFkZCgnaHR0cDovLy4uLicpXG4gICAgICpcbiAgICAgKiAgICAgLy8gb2JqZWN0IHN5bnRheFxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIG5hbWU6ICdrZXkyJyxcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIG5hbWU6ICdrZXkzJyxcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7fVxuICAgICAqICAgICB9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHBzOi8vLi4uJyxcbiAgICAgKiAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAqICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgKiAgICAgfSlcbiAgICAgKlxuICAgICAqICAgICAvLyB5b3UgY2FuIGFsc28gcGFzcyBhbiBhcnJheSBvZiBvYmplY3RzIG9yIHVybHMgb3IgYm90aFxuICAgICAqICAgICAuYWRkKFtcbiAgICAgKiAgICAgICAgIHsgbmFtZTogJ2tleTQnLCB1cmw6ICdodHRwOi8vLi4uJywgb25Db21wbGV0ZTogZnVuY3Rpb24gKCkge30gfSxcbiAgICAgKiAgICAgICAgIHsgdXJsOiAnaHR0cDovLy4uLicsIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHt9IH0sXG4gICAgICogICAgICAgICAnaHR0cDovLy4uLidcbiAgICAgKiAgICAgXSlcbiAgICAgKlxuICAgICAqICAgICAvLyBhbmQgeW91IGNhbiB1c2UgYm90aCBwYXJhbXMgYW5kIG9wdGlvbnNcbiAgICAgKiAgICAgLmFkZCgna2V5JywgJ2h0dHA6Ly8uLi4nLCB7IGNyb3NzT3JpZ2luOiB0cnVlIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKCdodHRwOi8vLi4uJywgeyBjcm9zc09yaWdpbjogdHJ1ZSB9LCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdIC0gVGhlIG5hbWUgb2YgdGhlIHJlc291cmNlIHRvIGxvYWQsIGlmIG5vdCBwYXNzZWQgdGhlIHVybCBpcyB1c2VkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsXSAtIFRoZSB1cmwgZm9yIHRoaXMgcmVzb3VyY2UsIHJlbGF0aXZlIHRvIHRoZSBiYXNlVXJsIG9mIHRoaXMgbG9hZGVyLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBUaGUgb3B0aW9ucyBmb3IgdGhlIGxvYWQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jcm9zc09yaWdpbl0gLSBJcyB0aGlzIHJlcXVlc3QgY3Jvc3Mtb3JpZ2luPyBEZWZhdWx0IGlzIHRvIGRldGVybWluZSBhdXRvbWF0aWNhbGx5LlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuTE9BRF9UWVBFfSBbb3B0aW9ucy5sb2FkVHlwZT1SZXNvdXJjZS5MT0FEX1RZUEUuWEhSXSAtIEhvdyBzaG91bGQgdGhpcyByZXNvdXJjZSBiZSBsb2FkZWQ/XG4gICAgICogQHBhcmFtIHtSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRX0gW29wdGlvbnMueGhyVHlwZT1SZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ERUZBVUxUXSAtIEhvdyBzaG91bGRcbiAgICAgKiAgICAgIHRoZSBkYXRhIGJlaW5nIGxvYWRlZCBiZSBpbnRlcnByZXRlZCB3aGVuIHVzaW5nIFhIUj9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMubWV0YWRhdGFdIC0gRXh0cmEgY29uZmlndXJhdGlvbiBmb3IgbWlkZGxld2FyZSBhbmQgdGhlIFJlc291cmNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR8SFRNTEF1ZGlvRWxlbWVudHxIVE1MVmlkZW9FbGVtZW50fSBbb3B0aW9ucy5tZXRhZGF0YS5sb2FkRWxlbWVudD1udWxsXSAtIFRoZVxuICAgICAqICAgICAgZWxlbWVudCB0byB1c2UgZm9yIGxvYWRpbmcsIGluc3RlYWQgb2YgY3JlYXRpbmcgb25lLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubWV0YWRhdGEuc2tpcFNvdXJjZT1mYWxzZV0gLSBTa2lwcyBhZGRpbmcgc291cmNlKHMpIHRvIHRoZSBsb2FkIGVsZW1lbnQuIFRoaXNcbiAgICAgKiAgICAgIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBwYXNzIGluIGEgYGxvYWRFbGVtZW50YCB0aGF0IHlvdSBhbHJlYWR5IGFkZGVkIGxvYWQgc291cmNlcyB0by5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2JdIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoaXMgc3BlY2lmaWMgcmVzb3VyY2UgY29tcGxldGVzIGxvYWRpbmcuXG4gICAgICogQHJldHVybiB7TG9hZGVyfSBSZXR1cm5zIGl0c2VsZi5cbiAgICAgKi9cblxuXG4gICAgTG9hZGVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQobmFtZSwgdXJsLCBvcHRpb25zLCBjYikge1xuICAgICAgICAvLyBzcGVjaWFsIGNhc2Ugb2YgYW4gYXJyYXkgb2Ygb2JqZWN0cyBvciB1cmxzXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZChuYW1lW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBhbiBvYmplY3QgaXMgcGFzc2VkIGluc3RlYWQgb2YgcGFyYW1zXG4gICAgICAgIGlmICgodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKG5hbWUpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNiID0gdXJsIHx8IG5hbWUuY2FsbGJhY2sgfHwgbmFtZS5vbkNvbXBsZXRlO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG5hbWU7XG4gICAgICAgICAgICB1cmwgPSBuYW1lLnVybDtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLm5hbWUgfHwgbmFtZS5rZXkgfHwgbmFtZS51cmw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYXNlIHdoZXJlIG5vIG5hbWUgaXMgcGFzc2VkIHNoaWZ0IGFsbCBhcmdzIG92ZXIgYnkgb25lLlxuICAgICAgICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNiID0gb3B0aW9ucztcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1cmw7XG4gICAgICAgICAgICB1cmwgPSBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IHRoYXQgd2Ugc2hpZnRlZCBtYWtlIHN1cmUgd2UgaGF2ZSBhIHByb3BlciB1cmwuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB1cmwgcGFzc2VkIHRvIGFkZCByZXNvdXJjZSB0byBsb2FkZXIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvcHRpb25zIGFyZSBvcHRpb25hbCBzbyBwZW9wbGUgbWlnaHQgcGFzcyBhIGZ1bmN0aW9uIGFuZCBubyBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBsb2FkaW5nIGFscmVhZHkgeW91IGNhbiBvbmx5IGFkZCByZXNvdXJjZXMgdGhhdCBoYXZlIGEgcGFyZW50LlxuICAgICAgICBpZiAodGhpcy5sb2FkaW5nICYmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5wYXJlbnRSZXNvdXJjZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGFkZCByZXNvdXJjZXMgd2hpbGUgdGhlIGxvYWRlciBpcyBydW5uaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgcmVzb3VyY2UgYWxyZWFkeSBleGlzdHMuXG4gICAgICAgIGlmICh0aGlzLnJlc291cmNlc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvdXJjZSBuYW1lZCBcIicgKyBuYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIGJhc2UgdXJsIGlmIHRoaXMgaXNuJ3QgYW4gYWJzb2x1dGUgdXJsXG4gICAgICAgIHVybCA9IHRoaXMuX3ByZXBhcmVVcmwodXJsKTtcblxuICAgICAgICAvLyBjcmVhdGUgdGhlIHN0b3JlIHRoZSByZXNvdXJjZVxuICAgICAgICB0aGlzLnJlc291cmNlc1tuYW1lXSA9IG5ldyBfUmVzb3VyY2UyLmRlZmF1bHQobmFtZSwgdXJsLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlc1tuYW1lXS5vbkFmdGVyTWlkZGxld2FyZS5vbmNlKGNiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGFjdGl2ZWx5IGxvYWRpbmcsIG1ha2Ugc3VyZSB0byBhZGp1c3QgcHJvZ3Jlc3MgY2h1bmtzIGZvciB0aGF0IHBhcmVudCBhbmQgaXRzIGNoaWxkcmVuXG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmcpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBvcHRpb25zLnBhcmVudFJlc291cmNlO1xuICAgICAgICAgICAgdmFyIGluY29tcGxldGVDaGlsZHJlbiA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgcGFyZW50LmNoaWxkcmVuLmxlbmd0aDsgKytfaSkge1xuICAgICAgICAgICAgICAgIGlmICghcGFyZW50LmNoaWxkcmVuW19pXS5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGluY29tcGxldGVDaGlsZHJlbi5wdXNoKHBhcmVudC5jaGlsZHJlbltfaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZ1bGxDaHVuayA9IHBhcmVudC5wcm9ncmVzc0NodW5rICogKGluY29tcGxldGVDaGlsZHJlbi5sZW5ndGggKyAxKTsgLy8gKzEgZm9yIHBhcmVudFxuICAgICAgICAgICAgdmFyIGVhY2hDaHVuayA9IGZ1bGxDaHVuayAvIChpbmNvbXBsZXRlQ2hpbGRyZW4ubGVuZ3RoICsgMik7IC8vICsyIGZvciBwYXJlbnQgJiBuZXcgY2hpbGRcblxuICAgICAgICAgICAgcGFyZW50LmNoaWxkcmVuLnB1c2godGhpcy5yZXNvdXJjZXNbbmFtZV0pO1xuICAgICAgICAgICAgcGFyZW50LnByb2dyZXNzQ2h1bmsgPSBlYWNoQ2h1bms7XG5cbiAgICAgICAgICAgIGZvciAodmFyIF9pMiA9IDA7IF9pMiA8IGluY29tcGxldGVDaGlsZHJlbi5sZW5ndGg7ICsrX2kyKSB7XG4gICAgICAgICAgICAgICAgaW5jb21wbGV0ZUNoaWxkcmVuW19pMl0ucHJvZ3Jlc3NDaHVuayA9IGVhY2hDaHVuaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCB0aGUgcmVzb3VyY2UgdG8gdGhlIHF1ZXVlXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2godGhpcy5yZXNvdXJjZXNbbmFtZV0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbWlkZGxld2FyZSBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuICpiZWZvcmUqIHRoZVxuICAgICAqIHJlc291cmNlIGlzIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgYmVmb3JlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gLSBUaGUgbWlkZGxld2FyZSBmdW5jdGlvbiB0byByZWdpc3Rlci5cbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLnByZSA9IGZ1bmN0aW9uIHByZShmbikge1xuICAgICAgICB0aGlzLl9iZWZvcmVNaWRkbGV3YXJlLnB1c2goZm4pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbWlkZGxld2FyZSBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuICphZnRlciogdGhlXG4gICAgICogcmVzb3VyY2UgaXMgbG9hZGVkLlxuICAgICAqXG4gICAgICogQGFsaWFzIHVzZVxuICAgICAqIEBtZXRob2QgYWZ0ZXJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiAtIFRoZSBtaWRkbGV3YXJlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyLlxuICAgICAqIEByZXR1cm4ge0xvYWRlcn0gUmV0dXJucyBpdHNlbGYuXG4gICAgICovXG5cblxuICAgIExvYWRlci5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gdXNlKGZuKSB7XG4gICAgICAgIHRoaXMuX2FmdGVyTWlkZGxld2FyZS5wdXNoKGZuKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBxdWV1ZSBvZiB0aGUgbG9hZGVyIHRvIHByZXBhcmUgZm9yIGEgbmV3IGxvYWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5raWxsKCk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gYWJvcnQgYWxsIHJlc291cmNlIGxvYWRzXG4gICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5yZXNvdXJjZXMpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLnJlc291cmNlc1trXTtcblxuICAgICAgICAgICAgaWYgKHJlcy5fb25Mb2FkQmluZGluZykge1xuICAgICAgICAgICAgICAgIHJlcy5fb25Mb2FkQmluZGluZy5kZXRhY2goKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzb3VyY2VzID0ge307XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBsb2FkaW5nIHRoZSBxdWV1ZWQgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NiXSAtIE9wdGlvbmFsIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBib3VuZCB0byB0aGUgYGNvbXBsZXRlYCBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGNiKSB7XG4gICAgICAgIC8vIHJlZ2lzdGVyIGNvbXBsZXRlIGNhbGxiYWNrIGlmIHRoZXkgcGFzcyBvbmVcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlLm9uY2UoY2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHF1ZXVlIGhhcyBhbHJlYWR5IHN0YXJ0ZWQgd2UgYXJlIGRvbmUgaGVyZVxuICAgICAgICBpZiAodGhpcy5sb2FkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRpc3RyaWJ1dGUgcHJvZ3Jlc3MgY2h1bmtzXG4gICAgICAgIHZhciBjaHVuayA9IDEwMCAvIHRoaXMuX3F1ZXVlLl90YXNrcy5sZW5ndGg7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9xdWV1ZS5fdGFza3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLl90YXNrc1tpXS5kYXRhLnByb2dyZXNzQ2h1bmsgPSBjaHVuaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBsb2FkaW5nIHN0YXRlXG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gbm90aWZ5IG9mIHN0YXJ0XG4gICAgICAgIHRoaXMub25TdGFydC5kaXNwYXRjaCh0aGlzKTtcblxuICAgICAgICAvLyBzdGFydCBsb2FkaW5nXG4gICAgICAgIHRoaXMuX3F1ZXVlLnJlc3VtZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQcmVwYXJlcyBhIHVybCBmb3IgdXNhZ2UgYmFzZWQgb24gdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhpcyBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFRoZSB1cmwgdG8gcHJlcGFyZS5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBwcmVwYXJlZCB1cmwuXG4gICAgICovXG5cblxuICAgIExvYWRlci5wcm90b3R5cGUuX3ByZXBhcmVVcmwgPSBmdW5jdGlvbiBfcHJlcGFyZVVybCh1cmwpIHtcbiAgICAgICAgdmFyIHBhcnNlZFVybCA9ICgwLCBfcGFyc2VVcmkyLmRlZmF1bHQpKHVybCwgeyBzdHJpY3RNb2RlOiB0cnVlIH0pO1xuICAgICAgICB2YXIgcmVzdWx0ID0gdm9pZCAwO1xuXG4gICAgICAgIC8vIGFic29sdXRlIHVybCwganVzdCB1c2UgaXQgYXMgaXMuXG4gICAgICAgIGlmIChwYXJzZWRVcmwucHJvdG9jb2wgfHwgIXBhcnNlZFVybC5wYXRoIHx8IHVybC5pbmRleE9mKCcvLycpID09PSAwKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgYmFzZVVybCBkb2Vzbid0IGVuZCBpbiBzbGFzaCBhbmQgdXJsIGRvZXNuJ3Qgc3RhcnQgd2l0aCBzbGFzaCwgdGhlbiBhZGQgYSBzbGFzaCBpbmJldHdlZW5cbiAgICAgICAgZWxzZSBpZiAodGhpcy5iYXNlVXJsLmxlbmd0aCAmJiB0aGlzLmJhc2VVcmwubGFzdEluZGV4T2YoJy8nKSAhPT0gdGhpcy5iYXNlVXJsLmxlbmd0aCAtIDEgJiYgdXJsLmNoYXJBdCgwKSAhPT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5iYXNlVXJsICsgJy8nICsgdXJsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmJhc2VVcmwgKyB1cmw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2UgbmVlZCB0byBhZGQgYSBkZWZhdWx0IHF1ZXJ5c3RyaW5nLCB0aGVyZSBpcyBhIGJpdCBtb3JlIHdvcmtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdFF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHJneEV4dHJhY3RVcmxIYXNoLmV4ZWMocmVzdWx0KVswXTtcblxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnN1YnN0cigwLCByZXN1bHQubGVuZ3RoIC0gaGFzaC5sZW5ndGgpO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LmluZGV4T2YoJz8nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJyYnICsgdGhpcy5kZWZhdWx0UXVlcnlTdHJpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnPycgKyB0aGlzLmRlZmF1bHRRdWVyeVN0cmluZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0ICs9IGhhc2g7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBhIHNpbmdsZSByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZX0gcmVzb3VyY2UgLSBUaGUgcmVzb3VyY2UgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZXF1ZXVlIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB3ZSBuZWVkIHRvIGRlcXVldWUgdGhpcyBpdGVtLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLl9sb2FkUmVzb3VyY2UgPSBmdW5jdGlvbiBfbG9hZFJlc291cmNlKHJlc291cmNlLCBkZXF1ZXVlKSB7XG4gICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgIHJlc291cmNlLl9kZXF1ZXVlID0gZGVxdWV1ZTtcblxuICAgICAgICAvLyBydW4gYmVmb3JlIG1pZGRsZXdhcmVcbiAgICAgICAgYXN5bmMuZWFjaFNlcmllcyh0aGlzLl9iZWZvcmVNaWRkbGV3YXJlLCBmdW5jdGlvbiAoZm4sIG5leHQpIHtcbiAgICAgICAgICAgIGZuLmNhbGwoX3RoaXMyLCByZXNvdXJjZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBiZWZvcmUgbWlkZGxld2FyZSBtYXJrcyB0aGUgcmVzb3VyY2UgYXMgY29tcGxldGUsXG4gICAgICAgICAgICAgICAgLy8gYnJlYWsgYW5kIGRvbid0IHByb2Nlc3MgYW55IG1vcmUgYmVmb3JlIG1pZGRsZXdhcmVcbiAgICAgICAgICAgICAgICBuZXh0KHJlc291cmNlLmlzQ29tcGxldGUgPyB7fSA6IG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMyLl9vbkxvYWQocmVzb3VyY2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5fb25Mb2FkQmluZGluZyA9IHJlc291cmNlLm9uQ29tcGxldGUub25jZShfdGhpczIuX29uTG9hZCwgX3RoaXMyKTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5sb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb25jZSBlYWNoIHJlc291cmNlIGhhcyBsb2FkZWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gX29uQ29tcGxldGUoKSB7XG4gICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMub25Db21wbGV0ZS5kaXNwYXRjaCh0aGlzLCB0aGlzLnJlc291cmNlcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBlYWNoIHRpbWUgYSByZXNvdXJjZXMgaXMgbG9hZGVkLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSAtIFRoZSByZXNvdXJjZSB0aGF0IHdhcyBsb2FkZWRcbiAgICAgKi9cblxuXG4gICAgTG9hZGVyLnByb3RvdHlwZS5fb25Mb2FkID0gZnVuY3Rpb24gX29uTG9hZChyZXNvdXJjZSkge1xuICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICByZXNvdXJjZS5fb25Mb2FkQmluZGluZyA9IG51bGw7XG5cbiAgICAgICAgLy8gcmVtb3ZlIHRoaXMgcmVzb3VyY2UgZnJvbSB0aGUgYXN5bmMgcXVldWUsIGFuZCBhZGQgaXQgdG8gb3VyIGxpc3Qgb2YgcmVzb3VyY2VzIHRoYXQgYXJlIGJlaW5nIHBhcnNlZFxuICAgICAgICByZXNvdXJjZS5fZGVxdWV1ZSgpO1xuICAgICAgICB0aGlzLl9yZXNvdXJjZXNQYXJzaW5nLnB1c2gocmVzb3VyY2UpO1xuXG4gICAgICAgIC8vIHJ1biBtaWRkbGV3YXJlLCB0aGlzICptdXN0KiBoYXBwZW4gYmVmb3JlIGRlcXVldWUgc28gc3ViLWFzc2V0cyBnZXQgYWRkZWQgcHJvcGVybHlcbiAgICAgICAgYXN5bmMuZWFjaFNlcmllcyh0aGlzLl9hZnRlck1pZGRsZXdhcmUsIGZ1bmN0aW9uIChmbiwgbmV4dCkge1xuICAgICAgICAgICAgZm4uY2FsbChfdGhpczMsIHJlc291cmNlLCBuZXh0KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb3VyY2Uub25BZnRlck1pZGRsZXdhcmUuZGlzcGF0Y2gocmVzb3VyY2UpO1xuXG4gICAgICAgICAgICBfdGhpczMucHJvZ3Jlc3MgKz0gcmVzb3VyY2UucHJvZ3Jlc3NDaHVuaztcbiAgICAgICAgICAgIF90aGlzMy5vblByb2dyZXNzLmRpc3BhdGNoKF90aGlzMywgcmVzb3VyY2UpO1xuXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfdGhpczMub25FcnJvci5kaXNwYXRjaChyZXNvdXJjZS5lcnJvciwgX3RoaXMzLCByZXNvdXJjZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF90aGlzMy5vbkxvYWQuZGlzcGF0Y2goX3RoaXMzLCByZXNvdXJjZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzMy5fcmVzb3VyY2VzUGFyc2luZy5zcGxpY2UoX3RoaXMzLl9yZXNvdXJjZXNQYXJzaW5nLmluZGV4T2YocmVzb3VyY2UpLCAxKTtcblxuICAgICAgICAgICAgLy8gZG8gY29tcGxldGlvbiBjaGVja1xuICAgICAgICAgICAgaWYgKF90aGlzMy5fcXVldWUuaWRsZSgpICYmIF90aGlzMy5fcmVzb3VyY2VzUGFyc2luZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpczMucHJvZ3Jlc3MgPSBNQVhfUFJPR1JFU1M7XG4gICAgICAgICAgICAgICAgX3RoaXMzLl9vbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gTG9hZGVyO1xufSgpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBMb2FkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Mb2FkZXIuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX3BhcnNlVXJpID0gcmVxdWlyZSgncGFyc2UtdXJpJyk7XG5cbnZhciBfcGFyc2VVcmkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcGFyc2VVcmkpO1xuXG52YXIgX21pbmlTaWduYWxzID0gcmVxdWlyZSgnbWluaS1zaWduYWxzJyk7XG5cbnZhciBfbWluaVNpZ25hbHMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbWluaVNpZ25hbHMpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vLyB0ZXN0cyBpcyBDT1JTIGlzIHN1cHBvcnRlZCBpbiBYSFIsIGlmIG5vdCB3ZSBuZWVkIHRvIHVzZSBYRFJcbnZhciB1c2VYZHIgPSAhISh3aW5kb3cuWERvbWFpblJlcXVlc3QgJiYgISgnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKSkpO1xudmFyIHRlbXBBbmNob3IgPSBudWxsO1xuXG4vLyBzb21lIHN0YXR1cyBjb25zdGFudHNcbnZhciBTVEFUVVNfTk9ORSA9IDA7XG52YXIgU1RBVFVTX09LID0gMjAwO1xudmFyIFNUQVRVU19FTVBUWSA9IDIwNDtcblxuLy8gbm9vcFxuZnVuY3Rpb24gX25vb3AoKSB7fSAvKiBlbXB0eSAqL1xuXG4vKipcbiAqIE1hbmFnZXMgdGhlIHN0YXRlIGFuZCBsb2FkaW5nIG9mIGEgcmVzb3VyY2UgYW5kIGFsbCBjaGlsZCByZXNvdXJjZXMuXG4gKlxuICogQGNsYXNzXG4gKi9cblxudmFyIFJlc291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGxvYWQgdHlwZSB0byBiZSB1c2VkIGZvciBhIHNwZWNpZmljIGV4dGVuc2lvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0bmFtZSAtIFRoZSBleHRlbnNpb24gdG8gc2V0IHRoZSB0eXBlIGZvciwgZS5nLiBcInBuZ1wiIG9yIFwiZm50XCJcbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlLkxPQURfVFlQRX0gbG9hZFR5cGUgLSBUaGUgbG9hZCB0eXBlIHRvIHNldCBpdCB0by5cbiAgICAgKi9cbiAgICBSZXNvdXJjZS5zZXRFeHRlbnNpb25Mb2FkVHlwZSA9IGZ1bmN0aW9uIHNldEV4dGVuc2lvbkxvYWRUeXBlKGV4dG5hbWUsIGxvYWRUeXBlKSB7XG4gICAgICAgIHNldEV4dE1hcChSZXNvdXJjZS5fbG9hZFR5cGVNYXAsIGV4dG5hbWUsIGxvYWRUeXBlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbG9hZCB0eXBlIHRvIGJlIHVzZWQgZm9yIGEgc3BlY2lmaWMgZXh0ZW5zaW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBleHRuYW1lIC0gVGhlIGV4dGVuc2lvbiB0byBzZXQgdGhlIHR5cGUgZm9yLCBlLmcuIFwicG5nXCIgb3IgXCJmbnRcIlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEV9IHhoclR5cGUgLSBUaGUgeGhyIHR5cGUgdG8gc2V0IGl0IHRvLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5zZXRFeHRlbnNpb25YaHJUeXBlID0gZnVuY3Rpb24gc2V0RXh0ZW5zaW9uWGhyVHlwZShleHRuYW1lLCB4aHJUeXBlKSB7XG4gICAgICAgIHNldEV4dE1hcChSZXNvdXJjZS5feGhyVHlwZU1hcCwgZXh0bmFtZSwgeGhyVHlwZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHJlc291cmNlIHRvIGxvYWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IHVybCAtIFRoZSB1cmwgZm9yIHRoaXMgcmVzb3VyY2UsIGZvciBhdWRpby92aWRlbyBsb2FkcyB5b3UgY2FuIHBhc3NcbiAgICAgKiAgICAgIGFuIGFycmF5IG9mIHNvdXJjZXMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIFRoZSBvcHRpb25zIGZvciB0aGUgbG9hZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xib29sZWFufSBbb3B0aW9ucy5jcm9zc09yaWdpbl0gLSBJcyB0aGlzIHJlcXVlc3QgY3Jvc3Mtb3JpZ2luPyBEZWZhdWx0IGlzIHRvXG4gICAgICogICAgICBkZXRlcm1pbmUgYXV0b21hdGljYWxseS5cbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlLkxPQURfVFlQRX0gW29wdGlvbnMubG9hZFR5cGU9UmVzb3VyY2UuTE9BRF9UWVBFLlhIUl0gLSBIb3cgc2hvdWxkIHRoaXMgcmVzb3VyY2VcbiAgICAgKiAgICAgIGJlIGxvYWRlZD9cbiAgICAgKiBAcGFyYW0ge1Jlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFfSBbb3B0aW9ucy54aHJUeXBlPVJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRFRkFVTFRdIC0gSG93XG4gICAgICogICAgICBzaG91bGQgdGhlIGRhdGEgYmVpbmcgbG9hZGVkIGJlIGludGVycHJldGVkIHdoZW4gdXNpbmcgWEhSP1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5tZXRhZGF0YV0gLSBFeHRyYSBjb25maWd1cmF0aW9uIGZvciBtaWRkbGV3YXJlIGFuZCB0aGUgUmVzb3VyY2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudHxIVE1MQXVkaW9FbGVtZW50fEhUTUxWaWRlb0VsZW1lbnR9IFtvcHRpb25zLm1ldGFkYXRhLmxvYWRFbGVtZW50PW51bGxdIC0gVGhlXG4gICAgICogICAgICBlbGVtZW50IHRvIHVzZSBmb3IgbG9hZGluZywgaW5zdGVhZCBvZiBjcmVhdGluZyBvbmUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5tZXRhZGF0YS5za2lwU291cmNlPWZhbHNlXSAtIFNraXBzIGFkZGluZyBzb3VyY2UocykgdG8gdGhlIGxvYWQgZWxlbWVudC4gVGhpc1xuICAgICAqICAgICAgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHBhc3MgaW4gYSBgbG9hZEVsZW1lbnRgIHRoYXQgeW91IGFscmVhZHkgYWRkZWQgbG9hZCBzb3VyY2VzIHRvLlxuICAgICAqL1xuXG5cbiAgICBmdW5jdGlvbiBSZXNvdXJjZShuYW1lLCB1cmwsIG9wdGlvbnMpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlc291cmNlKTtcblxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiB1cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JvdGggbmFtZSBhbmQgdXJsIGFyZSByZXF1aXJlZCBmb3IgY29uc3RydWN0aW5nIGEgcmVzb3VyY2UuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHN0YXRlIGZsYWdzIG9mIHRoaXMgcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2ZsYWdzID0gMDtcblxuICAgICAgICAvLyBzZXQgZGF0YSB1cmwgZmxhZywgbmVlZHMgdG8gYmUgc2V0IGVhcmx5IGZvciBzb21lIF9kZXRlcm1pbmVYIGNoZWNrcyB0byB3b3JrLlxuICAgICAgICB0aGlzLl9zZXRGbGFnKFJlc291cmNlLlNUQVRVU19GTEFHUy5EQVRBX1VSTCwgdXJsLmluZGV4T2YoJ2RhdGE6JykgPT09IDApO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGlzIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHVybCB1c2VkIHRvIGxvYWQgdGhpcyByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZGF0YSB0aGF0IHdhcyBsb2FkZWQgYnkgdGhlIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHthbnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmRhdGEgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJcyB0aGlzIHJlcXVlc3QgY3Jvc3Mtb3JpZ2luPyBJZiB1bnNldCwgZGV0ZXJtaW5lZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNyb3NzT3JpZ2luID0gb3B0aW9ucy5jcm9zc09yaWdpbiA9PT0gdHJ1ZSA/ICdhbm9ueW1vdXMnIDogb3B0aW9ucy5jcm9zc09yaWdpbjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1ldGhvZCBvZiBsb2FkaW5nIHRvIHVzZSBmb3IgdGhpcyByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7UmVzb3VyY2UuTE9BRF9UWVBFfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sb2FkVHlwZSA9IG9wdGlvbnMubG9hZFR5cGUgfHwgdGhpcy5fZGV0ZXJtaW5lTG9hZFR5cGUoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHR5cGUgdXNlZCB0byBsb2FkIHRoZSByZXNvdXJjZSB2aWEgWEhSLiBJZiB1bnNldCwgZGV0ZXJtaW5lZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnhoclR5cGUgPSBvcHRpb25zLnhoclR5cGU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEV4dHJhIGluZm8gZm9yIG1pZGRsZXdhcmUsIGFuZCBjb250cm9sbGluZyBzcGVjaWZpY3MgYWJvdXQgaG93IHRoZSByZXNvdXJjZSBsb2Fkcy5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IGlmIHlvdSBwYXNzIGluIGEgYGxvYWRFbGVtZW50YCwgdGhlIFJlc291cmNlIGNsYXNzIHRha2VzIG93bmVyc2hpcCBvZiBpdC5cbiAgICAgICAgICogTWVhbmluZyBpdCB3aWxsIG1vZGlmeSBpdCBhcyBpdCBzZWVzIGZpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgICAgICAgKiBAcHJvcGVydHkge0hUTUxJbWFnZUVsZW1lbnR8SFRNTEF1ZGlvRWxlbWVudHxIVE1MVmlkZW9FbGVtZW50fSBbbG9hZEVsZW1lbnQ9bnVsbF0gLSBUaGVcbiAgICAgICAgICogIGVsZW1lbnQgdG8gdXNlIGZvciBsb2FkaW5nLCBpbnN0ZWFkIG9mIGNyZWF0aW5nIG9uZS5cbiAgICAgICAgICogQHByb3BlcnR5IHtib29sZWFufSBbc2tpcFNvdXJjZT1mYWxzZV0gLSBTa2lwcyBhZGRpbmcgc291cmNlKHMpIHRvIHRoZSBsb2FkIGVsZW1lbnQuIFRoaXNcbiAgICAgICAgICogIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBwYXNzIGluIGEgYGxvYWRFbGVtZW50YCB0aGF0IHlvdSBhbHJlYWR5IGFkZGVkIGxvYWQgc291cmNlc1xuICAgICAgICAgKiAgdG8uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1ldGFkYXRhID0gb3B0aW9ucy5tZXRhZGF0YSB8fCB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgd2hpbGUgbG9hZGluZyAoaWYgYW55KS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7RXJyb3J9XG4gICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBYSFIgb2JqZWN0IHRoYXQgd2FzIHVzZWQgdG8gbG9hZCB0aGlzIHJlc291cmNlLiBUaGlzIGlzIG9ubHkgc2V0XG4gICAgICAgICAqIHdoZW4gYGxvYWRUeXBlYCBpcyBgUmVzb3VyY2UuTE9BRF9UWVBFLlhIUmAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge1hNTEh0dHBSZXF1ZXN0fVxuICAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMueGhyID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGNoaWxkIHJlc291cmNlcyB0aGlzIHJlc291cmNlIG93bnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge1Jlc291cmNlW119XG4gICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcmVzb3VyY2UgdHlwZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7UmVzb3VyY2UuVFlQRX1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSBSZXNvdXJjZS5UWVBFLlVOS05PV047XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9ncmVzcyBjaHVuayBvd25lZCBieSB0aGlzIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcm9ncmVzc0NodW5rID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBkZXF1ZXVlYCBtZXRob2QgdGhhdCB3aWxsIGJlIHVzZWQgYSBzdG9yYWdlIHBsYWNlIGZvciB0aGUgYXN5bmMgcXVldWUgZGVxdWV1ZSBtZXRob2RcbiAgICAgICAgICogdXNlZCBwcml2YXRlbHkgYnkgdGhlIGxvYWRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQG1lbWJlciB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9kZXF1ZXVlID0gX25vb3A7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVzZWQgYSBzdG9yYWdlIHBsYWNlIGZvciB0aGUgb24gbG9hZCBiaW5kaW5nIHVzZWQgcHJpdmF0ZWx5IGJ5IHRoZSBsb2FkZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb25Mb2FkQmluZGluZyA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgY29tcGxldGVgIGZ1bmN0aW9uIGJvdW5kIHRvIHRoaXMgcmVzb3VyY2UncyBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWVtYmVyIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JvdW5kQ29tcGxldGUgPSB0aGlzLmNvbXBsZXRlLmJpbmQodGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgX29uRXJyb3JgIGZ1bmN0aW9uIGJvdW5kIHRvIHRoaXMgcmVzb3VyY2UncyBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWVtYmVyIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JvdW5kT25FcnJvciA9IHRoaXMuX29uRXJyb3IuYmluZCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBfb25Qcm9ncmVzc2AgZnVuY3Rpb24gYm91bmQgdG8gdGhpcyByZXNvdXJjZSdzIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYm91bmRPblByb2dyZXNzID0gdGhpcy5fb25Qcm9ncmVzcy5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHhociBjYWxsYmFja3NcbiAgICAgICAgdGhpcy5fYm91bmRYaHJPbkVycm9yID0gdGhpcy5feGhyT25FcnJvci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9ib3VuZFhock9uQWJvcnQgPSB0aGlzLl94aHJPbkFib3J0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2JvdW5kWGhyT25Mb2FkID0gdGhpcy5feGhyT25Mb2FkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2JvdW5kWGRyT25UaW1lb3V0ID0gdGhpcy5feGRyT25UaW1lb3V0LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgd2hlbiB0aGUgcmVzb3VyY2UgYmVpbmdzIHRvIGxvYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjYWxsYmFjayBsb29rcyBsaWtlIHtAbGluayBSZXNvdXJjZS5PblN0YXJ0U2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vblN0YXJ0ID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIGVhY2ggdGltZSBwcm9ncmVzcyBvZiB0aGlzIHJlc291cmNlIGxvYWQgdXBkYXRlcy5cbiAgICAgICAgICogTm90IGFsbCByZXNvdXJjZXMgdHlwZXMgYW5kIGxvYWRlciBzeXN0ZW1zIGNhbiBzdXBwb3J0IHRoaXMgZXZlbnRcbiAgICAgICAgICogc28gc29tZXRpbWVzIGl0IG1heSBub3QgYmUgYXZhaWxhYmxlLiBJZiB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogaXMgYmVpbmcgbG9hZGVkIG9uIGEgbW9kZXJuIGJyb3dzZXIsIHVzaW5nIFhIUiwgYW5kIHRoZSByZW1vdGUgc2VydmVyXG4gICAgICAgICAqIHByb3Blcmx5IHNldHMgQ29udGVudC1MZW5ndGggaGVhZGVycywgdGhlbiB0aGlzIHdpbGwgYmUgYXZhaWxhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2FsbGJhY2sgbG9va3MgbGlrZSB7QGxpbmsgUmVzb3VyY2UuT25Qcm9ncmVzc1NpZ25hbH0uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge1NpZ25hbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMub25Qcm9ncmVzcyA9IG5ldyBfbWluaVNpZ25hbHMyLmRlZmF1bHQoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2hlZCBvbmNlIHRoaXMgcmVzb3VyY2UgaGFzIGxvYWRlZCwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIGl0IHdpbGxcbiAgICAgICAgICogYmUgaW4gdGhlIGBlcnJvcmAgcHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjYWxsYmFjayBsb29rcyBsaWtlIHtAbGluayBSZXNvdXJjZS5PbkNvbXBsZXRlU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIGFmdGVyIHRoaXMgcmVzb3VyY2UgaGFzIGhhZCBhbGwgdGhlICphZnRlciogbWlkZGxld2FyZSBydW4gb24gaXQuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjYWxsYmFjayBsb29rcyBsaWtlIHtAbGluayBSZXNvdXJjZS5PbkNvbXBsZXRlU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkFmdGVyTWlkZGxld2FyZSA9IG5ldyBfbWluaVNpZ25hbHMyLmRlZmF1bHQoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgcmVzb3VyY2Ugc3RhcnRzIHRvIGxvYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZXNvdXJjZVxuICAgICAgICAgKiBAY2FsbGJhY2sgT25TdGFydFNpZ25hbFxuICAgICAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSAtIFRoZSByZXNvdXJjZSB0aGF0IHRoZSBldmVudCBoYXBwZW5lZCBvbi5cbiAgICAgICAgICovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZW4gdGhlIHJlc291cmNlIHJlcG9ydHMgbG9hZGluZyBwcm9ncmVzcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlXG4gICAgICAgICAqIEBjYWxsYmFjayBPblByb2dyZXNzU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgdGhlIGV2ZW50IGhhcHBlbmVkIG9uLlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudGFnZSAtIFRoZSBwcm9ncmVzcyBvZiB0aGUgbG9hZCBpbiB0aGUgcmFuZ2UgWzAsIDFdLlxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgcmVzb3VyY2UgZmluaXNoZXMgbG9hZGluZy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlXG4gICAgICAgICAqIEBjYWxsYmFjayBPbkNvbXBsZXRlU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgdGhlIGV2ZW50IGhhcHBlbmVkIG9uLlxuICAgICAgICAgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZXMgd2hldGhlciBvciBub3QgdGhpcyB1cmwgaXMgYSBkYXRhIHVybC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXIge2Jvb2xlYW59XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG5cblxuICAgIC8qKlxuICAgICAqIE1hcmtzIHRoZSByZXNvdXJjZSBhcyBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqL1xuICAgIFJlc291cmNlLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgICAvLyBUT0RPOiBDbGVhbiB0aGlzIHVwIGluIGEgd3JhcHBlciBvciBzb21ldGhpbmcuLi5ncm9zcy4uLi5cbiAgICAgICAgaWYgKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fYm91bmRPbkVycm9yLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMuX2JvdW5kQ29tcGxldGUsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIHRoaXMuX2JvdW5kT25Qcm9ncmVzcywgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NhbnBsYXl0aHJvdWdoJywgdGhpcy5fYm91bmRDb21wbGV0ZSwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMueGhyKSB7XG4gICAgICAgICAgICBpZiAodGhpcy54aHIucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fYm91bmRYaHJPbkVycm9yLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCB0aGlzLl9ib3VuZFhock9uQWJvcnQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnhoci5yZW1vdmVFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIHRoaXMuX2JvdW5kT25Qcm9ncmVzcywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzLl9ib3VuZFhock9uTG9hZCwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnhoci5vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnhoci5vbnRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLm9ucHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbXBsZXRlIGNhbGxlZCBhZ2FpbiBmb3IgYW4gYWxyZWFkeSBjb21wbGV0ZWQgcmVzb3VyY2UuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zZXRGbGFnKFJlc291cmNlLlNUQVRVU19GTEFHUy5DT01QTEVURSwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3NldEZsYWcoUmVzb3VyY2UuU1RBVFVTX0ZMQUdTLkxPQURJTkcsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLm9uQ29tcGxldGUuZGlzcGF0Y2godGhpcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFib3J0cyB0aGUgbG9hZGluZyBvZiB0aGlzIHJlc291cmNlLCB3aXRoIGFuIG9wdGlvbmFsIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIHVzZSBmb3IgdGhlIGVycm9yXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uIGFib3J0KG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gYWJvcnQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcywgaWdub3JlIHN1YnNlcXVlbnQgY2FsbHMuXG4gICAgICAgIGlmICh0aGlzLmVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdG9yZSBlcnJvclxuICAgICAgICB0aGlzLmVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuXG4gICAgICAgIC8vIGFib3J0IHRoZSBhY3R1YWwgbG9hZGluZ1xuICAgICAgICBpZiAodGhpcy54aHIpIHtcbiAgICAgICAgICAgIHRoaXMueGhyLmFib3J0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy54ZHIpIHtcbiAgICAgICAgICAgIHRoaXMueGRyLmFib3J0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5kYXRhKSB7XG4gICAgICAgICAgICAvLyBzaW5nbGUgc291cmNlXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhLnNyYykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5zcmMgPSBSZXNvdXJjZS5FTVBUWV9HSUY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBtdWx0aS1zb3VyY2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5kYXRhLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5yZW1vdmVDaGlsZCh0aGlzLmRhdGEuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkb25lIG5vdy5cbiAgICAgICAgdGhpcy5jb21wbGV0ZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBLaWNrcyBvZmYgbG9hZGluZyBvZiB0aGlzIHJlc291cmNlLiBUaGlzIG1ldGhvZCBpcyBhc3luY2hyb25vdXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2JdIC0gT3B0aW9uYWwgY2FsbGJhY2sgdG8gY2FsbCBvbmNlIHRoZSByZXNvdXJjZSBpcyBsb2FkZWQuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gbG9hZChjYikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNDb21wbGV0ZSkge1xuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihfdGhpcyk7XG4gICAgICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChjYikge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlLm9uY2UoY2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2V0RmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuTE9BRElORywgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5vblN0YXJ0LmRpc3BhdGNoKHRoaXMpO1xuXG4gICAgICAgIC8vIGlmIHVuc2V0LCBkZXRlcm1pbmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICh0aGlzLmNyb3NzT3JpZ2luID09PSBmYWxzZSB8fCB0eXBlb2YgdGhpcy5jcm9zc09yaWdpbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuY3Jvc3NPcmlnaW4gPSB0aGlzLl9kZXRlcm1pbmVDcm9zc09yaWdpbih0aGlzLnVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMubG9hZFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuTE9BRF9UWVBFLklNQUdFOlxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuSU1BR0U7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9hZEVsZW1lbnQoJ2ltYWdlJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuTE9BRF9UWVBFLkFVRElPOlxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuQVVESU87XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9hZFNvdXJjZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuTE9BRF9UWVBFLlZJREVPOlxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuVklERU87XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9hZFNvdXJjZUVsZW1lbnQoJ3ZpZGVvJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuTE9BRF9UWVBFLlhIUjpcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKHVzZVhkciAmJiB0aGlzLmNyb3NzT3JpZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRYZHIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkWGhyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgZmxhZyBpcyBzZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnIC0gVGhlIGZsYWcgdG8gY2hlY2suXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgZmxhZyBpcyBzZXQuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5faGFzRmxhZyA9IGZ1bmN0aW9uIF9oYXNGbGFnKGZsYWcpIHtcbiAgICAgICAgcmV0dXJuICEhKHRoaXMuX2ZsYWdzICYgZmxhZyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIChVbilTZXRzIHRoZSBmbGFnLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZmxhZyAtIFRoZSBmbGFnIHRvICh1bilzZXQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAtIFdoZXRoZXIgdG8gc2V0IG9yICh1bilzZXQgdGhlIGZsYWcuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fc2V0RmxhZyA9IGZ1bmN0aW9uIF9zZXRGbGFnKGZsYWcsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2ZsYWdzID0gdmFsdWUgPyB0aGlzLl9mbGFncyB8IGZsYWcgOiB0aGlzLl9mbGFncyAmIH5mbGFnO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyB0aGlzIHJlc291cmNlcyB1c2luZyBhbiBlbGVtZW50IHRoYXQgaGFzIGEgc2luZ2xlIHNvdXJjZSxcbiAgICAgKiBsaWtlIGFuIEhUTUxJbWFnZUVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgb2YgZWxlbWVudCB0byB1c2UuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fbG9hZEVsZW1lbnQgPSBmdW5jdGlvbiBfbG9hZEVsZW1lbnQodHlwZSkge1xuICAgICAgICBpZiAodGhpcy5tZXRhZGF0YS5sb2FkRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5tZXRhZGF0YS5sb2FkRWxlbWVudDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnaW1hZ2UnICYmIHR5cGVvZiB3aW5kb3cuSW1hZ2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5jcm9zc09yaWdpbikge1xuICAgICAgICAgICAgdGhpcy5kYXRhLmNyb3NzT3JpZ2luID0gdGhpcy5jcm9zc09yaWdpbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5tZXRhZGF0YS5za2lwU291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEuc3JjID0gdGhpcy51cmw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9ib3VuZE9uRXJyb3IsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzLl9ib3VuZENvbXBsZXRlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZGF0YS5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIHRoaXMuX2JvdW5kT25Qcm9ncmVzcywgZmFsc2UpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyB0aGlzIHJlc291cmNlcyB1c2luZyBhbiBlbGVtZW50IHRoYXQgaGFzIG11bHRpcGxlIHNvdXJjZXMsXG4gICAgICogbGlrZSBhbiBIVE1MQXVkaW9FbGVtZW50IG9yIEhUTUxWaWRlb0VsZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgb2YgZWxlbWVudCB0byB1c2UuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fbG9hZFNvdXJjZUVsZW1lbnQgPSBmdW5jdGlvbiBfbG9hZFNvdXJjZUVsZW1lbnQodHlwZSkge1xuICAgICAgICBpZiAodGhpcy5tZXRhZGF0YS5sb2FkRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5tZXRhZGF0YS5sb2FkRWxlbWVudDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnYXVkaW8nICYmIHR5cGVvZiB3aW5kb3cuQXVkaW8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBuZXcgQXVkaW8oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kYXRhID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFib3J0KCdVbnN1cHBvcnRlZCBlbGVtZW50OiAnICsgdHlwZSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5tZXRhZGF0YS5za2lwU291cmNlKSB7XG4gICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBDb2Nvb25KUyBDYW52YXMrIHJ1bnRpbWUsIGxhY2tzIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpXG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLmlzQ29jb29uSlMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuc3JjID0gQXJyYXkuaXNBcnJheSh0aGlzLnVybCkgPyB0aGlzLnVybFswXSA6IHRoaXMudXJsO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRoaXMudXJsKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cmwubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFwcGVuZENoaWxkKHRoaXMuX2NyZWF0ZVNvdXJjZSh0eXBlLCB0aGlzLnVybFtpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFwcGVuZENoaWxkKHRoaXMuX2NyZWF0ZVNvdXJjZSh0eXBlLCB0aGlzLnVybCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fYm91bmRPbkVycm9yLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZGF0YS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcy5fYm91bmRDb21wbGV0ZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmRhdGEuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCB0aGlzLl9ib3VuZE9uUHJvZ3Jlc3MsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZEV2ZW50TGlzdGVuZXIoJ2NhbnBsYXl0aHJvdWdoJywgdGhpcy5fYm91bmRDb21wbGV0ZSwgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMuZGF0YS5sb2FkKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoaXMgcmVzb3VyY2VzIHVzaW5nIGFuIFhNTEh0dHBSZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9sb2FkWGhyID0gZnVuY3Rpb24gX2xvYWRYaHIoKSB7XG4gICAgICAgIC8vIGlmIHVuc2V0LCBkZXRlcm1pbmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy54aHJUeXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy54aHJUeXBlID0gdGhpcy5fZGV0ZXJtaW5lWGhyVHlwZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHhociA9IHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gc2V0IHRoZSByZXF1ZXN0IHR5cGUgYW5kIHVybFxuICAgICAgICB4aHIub3BlbignR0VUJywgdGhpcy51cmwsIHRydWUpO1xuXG4gICAgICAgIC8vIGxvYWQganNvbiBhcyB0ZXh0IGFuZCBwYXJzZSBpdCBvdXJzZWx2ZXMuIFdlIGRvIHRoaXMgYmVjYXVzZSBzb21lIGJyb3dzZXJzXG4gICAgICAgIC8vICpjb3VnaCogc2FmYXJpICpjb3VnaCogY2FuJ3QgZGVhbCB3aXRoIGl0LlxuICAgICAgICBpZiAodGhpcy54aHJUeXBlID09PSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5KU09OIHx8IHRoaXMueGhyVHlwZSA9PT0gUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuRE9DVU1FTlQpIHtcbiAgICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5URVhUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IHRoaXMueGhyVHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMuX2JvdW5kWGhyT25FcnJvciwgZmFsc2UpO1xuICAgICAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCB0aGlzLl9ib3VuZFhock9uQWJvcnQsIGZhbHNlKTtcbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgdGhpcy5fYm91bmRPblByb2dyZXNzLCBmYWxzZSk7XG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcy5fYm91bmRYaHJPbkxvYWQsIGZhbHNlKTtcblxuICAgICAgICB4aHIuc2VuZCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyB0aGlzIHJlc291cmNlcyB1c2luZyBhbiBYRG9tYWluUmVxdWVzdC4gVGhpcyBpcyBoZXJlIGJlY2F1c2Ugd2UgbmVlZCB0byBzdXBwb3J0IElFOSAoZ3Jvc3MpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9sb2FkWGRyID0gZnVuY3Rpb24gX2xvYWRYZHIoKSB7XG4gICAgICAgIC8vIGlmIHVuc2V0LCBkZXRlcm1pbmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy54aHJUeXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy54aHJUeXBlID0gdGhpcy5fZGV0ZXJtaW5lWGhyVHlwZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHhkciA9IHRoaXMueGhyID0gbmV3IFhEb21haW5SZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gWERvbWFpblJlcXVlc3QgaGFzIGEgZmV3IHF1aXJrcy4gT2NjYXNpb25hbGx5IGl0IHdpbGwgYWJvcnQgcmVxdWVzdHNcbiAgICAgICAgLy8gQSB3YXkgdG8gYXZvaWQgdGhpcyBpcyB0byBtYWtlIHN1cmUgQUxMIGNhbGxiYWNrcyBhcmUgc2V0IGV2ZW4gaWYgbm90IHVzZWRcbiAgICAgICAgLy8gTW9yZSBpbmZvIGhlcmU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTU3ODY5NjYveGRvbWFpbnJlcXVlc3QtYWJvcnRzLXBvc3Qtb24taWUtOVxuICAgICAgICB4ZHIudGltZW91dCA9IDUwMDA7XG5cbiAgICAgICAgeGRyLm9uZXJyb3IgPSB0aGlzLl9ib3VuZFhock9uRXJyb3I7XG4gICAgICAgIHhkci5vbnRpbWVvdXQgPSB0aGlzLl9ib3VuZFhkck9uVGltZW91dDtcbiAgICAgICAgeGRyLm9ucHJvZ3Jlc3MgPSB0aGlzLl9ib3VuZE9uUHJvZ3Jlc3M7XG4gICAgICAgIHhkci5vbmxvYWQgPSB0aGlzLl9ib3VuZFhock9uTG9hZDtcblxuICAgICAgICB4ZHIub3BlbignR0VUJywgdGhpcy51cmwsIHRydWUpO1xuXG4gICAgICAgIC8vIE5vdGU6IFRoZSB4ZHIuc2VuZCgpIGNhbGwgaXMgd3JhcHBlZCBpbiBhIHRpbWVvdXQgdG8gcHJldmVudCBhblxuICAgICAgICAvLyBpc3N1ZSB3aXRoIHRoZSBpbnRlcmZhY2Ugd2hlcmUgc29tZSByZXF1ZXN0cyBhcmUgbG9zdCBpZiBtdWx0aXBsZVxuICAgICAgICAvLyBYRG9tYWluUmVxdWVzdHMgYXJlIGJlaW5nIHNlbnQgYXQgdGhlIHNhbWUgdGltZS5cbiAgICAgICAgLy8gU29tZSBpbmZvIGhlcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9waG90b25zdG9ybS9waGFzZXIvaXNzdWVzLzEyNDhcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4geGRyLnNlbmQoKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzb3VyY2UgdXNlZCBpbiBsb2FkaW5nIHZpYSBhbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIFRoZSBlbGVtZW50IHR5cGUgKHZpZGVvIG9yIGF1ZGlvKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIHNvdXJjZSBVUkwgdG8gbG9hZCBmcm9tLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbbWltZV0gLSBUaGUgbWltZSB0eXBlIG9mIHRoZSB2aWRlb1xuICAgICAqIEByZXR1cm4ge0hUTUxTb3VyY2VFbGVtZW50fSBUaGUgc291cmNlIGVsZW1lbnQuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fY3JlYXRlU291cmNlID0gZnVuY3Rpb24gX2NyZWF0ZVNvdXJjZSh0eXBlLCB1cmwsIG1pbWUpIHtcbiAgICAgICAgaWYgKCFtaW1lKSB7XG4gICAgICAgICAgICBtaW1lID0gdHlwZSArICcvJyArIHVybC5zdWJzdHIodXJsLmxhc3RJbmRleE9mKCcuJykgKyAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcblxuICAgICAgICBzb3VyY2Uuc3JjID0gdXJsO1xuICAgICAgICBzb3VyY2UudHlwZSA9IG1pbWU7XG5cbiAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGlmIGEgbG9hZCBlcnJvcnMgb3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBUaGUgZXJyb3IgZXZlbnQgZnJvbSB0aGUgZWxlbWVudCB0aGF0IGVtaXRzIGl0LlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fb25FcnJvciA9IGZ1bmN0aW9uIF9vbkVycm9yKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuYWJvcnQoJ0ZhaWxlZCB0byBsb2FkIGVsZW1lbnQgdXNpbmc6ICcgKyBldmVudC50YXJnZXQubm9kZU5hbWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgaWYgYSBsb2FkIHByb2dyZXNzIGV2ZW50IGZpcmVzIGZvciB4aHIveGRyLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge1hNTEh0dHBSZXF1ZXN0UHJvZ3Jlc3NFdmVudHxFdmVudH0gZXZlbnQgLSBQcm9ncmVzcyBldmVudC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9vblByb2dyZXNzID0gZnVuY3Rpb24gX29uUHJvZ3Jlc3MoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50ICYmIGV2ZW50Lmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMub25Qcm9ncmVzcy5kaXNwYXRjaCh0aGlzLCBldmVudC5sb2FkZWQgLyBldmVudC50b3RhbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGlmIGFuIGVycm9yIGV2ZW50IGZpcmVzIGZvciB4aHIveGRyLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge1hNTEh0dHBSZXF1ZXN0RXJyb3JFdmVudHxFdmVudH0gZXZlbnQgLSBFcnJvciBldmVudC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl94aHJPbkVycm9yID0gZnVuY3Rpb24gX3hock9uRXJyb3IoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhocjtcblxuICAgICAgICB0aGlzLmFib3J0KHJlcVR5cGUoeGhyKSArICcgUmVxdWVzdCBmYWlsZWQuIFN0YXR1czogJyArIHhoci5zdGF0dXMgKyAnLCB0ZXh0OiBcIicgKyB4aHIuc3RhdHVzVGV4dCArICdcIicpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgaWYgYW4gYWJvcnQgZXZlbnQgZmlyZXMgZm9yIHhoci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdEFib3J0RXZlbnR9IGV2ZW50IC0gQWJvcnQgRXZlbnRcbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl94aHJPbkFib3J0ID0gZnVuY3Rpb24gX3hock9uQWJvcnQoKSB7XG4gICAgICAgIHRoaXMuYWJvcnQocmVxVHlwZSh0aGlzLnhocikgKyAnIFJlcXVlc3Qgd2FzIGFib3J0ZWQgYnkgdGhlIHVzZXIuJyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBpZiBhIHRpbWVvdXQgZXZlbnQgZmlyZXMgZm9yIHhkci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBUaW1lb3V0IGV2ZW50LlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX3hkck9uVGltZW91dCA9IGZ1bmN0aW9uIF94ZHJPblRpbWVvdXQoKSB7XG4gICAgICAgIHRoaXMuYWJvcnQocmVxVHlwZSh0aGlzLnhocikgKyAnIFJlcXVlc3QgdGltZWQgb3V0LicpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBkYXRhIHN1Y2Nlc3NmdWxseSBsb2FkcyBmcm9tIGFuIHhoci94ZHIgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdExvYWRFdmVudHxFdmVudH0gZXZlbnQgLSBMb2FkIGV2ZW50XG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5feGhyT25Mb2FkID0gZnVuY3Rpb24gX3hock9uTG9hZCgpIHtcbiAgICAgICAgdmFyIHhociA9IHRoaXMueGhyO1xuICAgICAgICB2YXIgc3RhdHVzID0gdHlwZW9mIHhoci5zdGF0dXMgPT09ICd1bmRlZmluZWQnID8geGhyLnN0YXR1cyA6IFNUQVRVU19PSzsgLy8gWERSIGhhcyBubyBgLnN0YXR1c2AsIGFzc3VtZSAyMDAuXG5cbiAgICAgICAgLy8gc3RhdHVzIGNhbiBiZSAwIHdoZW4gdXNpbmcgdGhlIGBmaWxlOi8vYCBwcm90b2NvbCBzbyB3ZSBhbHNvIGNoZWNrIGlmIGEgcmVzcG9uc2UgaXMgc2V0XG4gICAgICAgIGlmIChzdGF0dXMgPT09IFNUQVRVU19PSyB8fCBzdGF0dXMgPT09IFNUQVRVU19FTVBUWSB8fCBzdGF0dXMgPT09IFNUQVRVU19OT05FICYmIHhoci5yZXNwb25zZVRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gaWYgdGV4dCwganVzdCByZXR1cm4gaXRcbiAgICAgICAgICAgIGlmICh0aGlzLnhoclR5cGUgPT09IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLlRFWFQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuVEVYVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGpzb24sIHBhcnNlIGludG8ganNvbiBvYmplY3RcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMueGhyVHlwZSA9PT0gUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuSlNPTikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuSlNPTjtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgnRXJyb3IgdHJ5aW5nIHRvIHBhcnNlIGxvYWRlZCBqc29uOiAnICsgZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB4bWwsIHBhcnNlIGludG8gYW4geG1sIGRvY3VtZW50IG9yIGRpdiBlbGVtZW50XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy54aHJUeXBlID09PSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LkRPTVBhcnNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG9tcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRvbXBhcnNlci5wYXJzZUZyb21TdHJpbmcoeGhyLnJlc3BvbnNlVGV4dCwgJ3RleHQveG1sJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSB4aHIucmVzcG9uc2VUZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRpdjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBSZXNvdXJjZS5UWVBFLlhNTDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCdFcnJvciB0cnlpbmcgdG8gcGFyc2UgbG9hZGVkIHhtbDogJyArIGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIGp1c3QgcmV0dXJuIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWJvcnQoJ1snICsgeGhyLnN0YXR1cyArICddICcgKyB4aHIuc3RhdHVzVGV4dCArICc6ICcgKyB4aHIucmVzcG9uc2VVUkwpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGBjcm9zc09yaWdpbmAgcHJvcGVydHkgZm9yIHRoaXMgcmVzb3VyY2UgYmFzZWQgb24gaWYgdGhlIHVybFxuICAgICAqIGZvciB0aGlzIHJlc291cmNlIGlzIGNyb3NzLW9yaWdpbi4gSWYgY3Jvc3NPcmlnaW4gd2FzIG1hbnVhbGx5IHNldCwgdGhpc1xuICAgICAqIGZ1bmN0aW9uIGRvZXMgbm90aGluZy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFRoZSB1cmwgdG8gdGVzdC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2xvYz13aW5kb3cubG9jYXRpb25dIC0gVGhlIGxvY2F0aW9uIG9iamVjdCB0byB0ZXN0IGFnYWluc3QuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3Jvc3NPcmlnaW4gdmFsdWUgdG8gdXNlIChvciBlbXB0eSBzdHJpbmcgZm9yIG5vbmUpLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2RldGVybWluZUNyb3NzT3JpZ2luID0gZnVuY3Rpb24gX2RldGVybWluZUNyb3NzT3JpZ2luKHVybCwgbG9jKSB7XG4gICAgICAgIC8vIGRhdGE6IGFuZCBqYXZhc2NyaXB0OiB1cmxzIGFyZSBjb25zaWRlcmVkIHNhbWUtb3JpZ2luXG4gICAgICAgIGlmICh1cmwuaW5kZXhPZignZGF0YTonKSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCBpcyB3aW5kb3cubG9jYXRpb25cbiAgICAgICAgbG9jID0gbG9jIHx8IHdpbmRvdy5sb2NhdGlvbjtcblxuICAgICAgICBpZiAoIXRlbXBBbmNob3IpIHtcbiAgICAgICAgICAgIHRlbXBBbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZXQgdGhlIGJyb3dzZXIgZGV0ZXJtaW5lIHRoZSBmdWxsIGhyZWYgZm9yIHRoZSB1cmwgb2YgdGhpcyByZXNvdXJjZSBhbmQgdGhlblxuICAgICAgICAvLyBwYXJzZSB3aXRoIHRoZSBub2RlIHVybCBsaWIsIHdlIGNhbid0IHVzZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgYW5jaG9yIGVsZW1lbnRcbiAgICAgICAgLy8gYmVjYXVzZSB0aGV5IGRvbid0IHdvcmsgaW4gSUU5IDooXG4gICAgICAgIHRlbXBBbmNob3IuaHJlZiA9IHVybDtcbiAgICAgICAgdXJsID0gKDAsIF9wYXJzZVVyaTIuZGVmYXVsdCkodGVtcEFuY2hvci5ocmVmLCB7IHN0cmljdE1vZGU6IHRydWUgfSk7XG5cbiAgICAgICAgdmFyIHNhbWVQb3J0ID0gIXVybC5wb3J0ICYmIGxvYy5wb3J0ID09PSAnJyB8fCB1cmwucG9ydCA9PT0gbG9jLnBvcnQ7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHVybC5wcm90b2NvbCA/IHVybC5wcm90b2NvbCArICc6JyA6ICcnO1xuXG4gICAgICAgIC8vIGlmIGNyb3NzIG9yaWdpblxuICAgICAgICBpZiAodXJsLmhvc3QgIT09IGxvYy5ob3N0bmFtZSB8fCAhc2FtZVBvcnQgfHwgcHJvdG9jb2wgIT09IGxvYy5wcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuICdhbm9ueW1vdXMnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSByZXNwb25zZVR5cGUgb2YgYW4gWEhSIHJlcXVlc3QgYmFzZWQgb24gdGhlIGV4dGVuc2lvbiBvZiB0aGVcbiAgICAgKiByZXNvdXJjZSBiZWluZyBsb2FkZWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge1Jlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFfSBUaGUgcmVzcG9uc2VUeXBlIHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9kZXRlcm1pbmVYaHJUeXBlID0gZnVuY3Rpb24gX2RldGVybWluZVhoclR5cGUoKSB7XG4gICAgICAgIHJldHVybiBSZXNvdXJjZS5feGhyVHlwZU1hcFt0aGlzLl9nZXRFeHRlbnNpb24oKV0gfHwgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB0aGUgbG9hZFR5cGUgb2YgYSByZXNvdXJjZSBiYXNlZCBvbiB0aGUgZXh0ZW5zaW9uIG9mIHRoZVxuICAgICAqIHJlc291cmNlIGJlaW5nIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7UmVzb3VyY2UuTE9BRF9UWVBFfSBUaGUgbG9hZFR5cGUgdG8gdXNlLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2RldGVybWluZUxvYWRUeXBlID0gZnVuY3Rpb24gX2RldGVybWluZUxvYWRUeXBlKCkge1xuICAgICAgICByZXR1cm4gUmVzb3VyY2UuX2xvYWRUeXBlTWFwW3RoaXMuX2dldEV4dGVuc2lvbigpXSB8fCBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0cyB0aGUgZXh0ZW5zaW9uIChzYW5zICcuJykgb2YgdGhlIGZpbGUgYmVpbmcgbG9hZGVkIGJ5IHRoZSByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgZXh0ZW5zaW9uLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2dldEV4dGVuc2lvbiA9IGZ1bmN0aW9uIF9nZXRFeHRlbnNpb24oKSB7XG4gICAgICAgIHZhciB1cmwgPSB0aGlzLnVybDtcbiAgICAgICAgdmFyIGV4dCA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLmlzRGF0YVVybCkge1xuICAgICAgICAgICAgdmFyIHNsYXNoSW5kZXggPSB1cmwuaW5kZXhPZignLycpO1xuXG4gICAgICAgICAgICBleHQgPSB1cmwuc3Vic3RyaW5nKHNsYXNoSW5kZXggKyAxLCB1cmwuaW5kZXhPZignOycsIHNsYXNoSW5kZXgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBxdWVyeVN0YXJ0ID0gdXJsLmluZGV4T2YoJz8nKTtcblxuICAgICAgICAgICAgaWYgKHF1ZXJ5U3RhcnQgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cmluZygwLCBxdWVyeVN0YXJ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXh0ID0gdXJsLnN1YnN0cmluZyh1cmwubGFzdEluZGV4T2YoJy4nKSArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSBtaW1lIHR5cGUgb2YgYW4gWEhSIHJlcXVlc3QgYmFzZWQgb24gdGhlIHJlc3BvbnNlVHlwZSBvZlxuICAgICAqIHJlc291cmNlIGJlaW5nIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRX0gdHlwZSAtIFRoZSB0eXBlIHRvIGdldCBhIG1pbWUgdHlwZSBmb3IuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgbWltZSB0eXBlIHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9nZXRNaW1lRnJvbVhoclR5cGUgPSBmdW5jdGlvbiBfZ2V0TWltZUZyb21YaHJUeXBlKHR5cGUpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJVRkZFUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LWJpbmFyeSc7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQjpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL2Jsb2InO1xuXG4gICAgICAgICAgICBjYXNlIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5UOlxuICAgICAgICAgICAgICAgIHJldHVybiAnYXBwbGljYXRpb24veG1sJztcblxuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5KU09OOlxuICAgICAgICAgICAgICAgIHJldHVybiAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuREVGQVVMVDpcbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVDpcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0ZXh0L3BsYWluJztcblxuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9jcmVhdGVDbGFzcyhSZXNvdXJjZSwgW3tcbiAgICAgICAga2V5OiAnaXNEYXRhVXJsJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzRmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuREFUQV9VUkwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlc2NyaWJlcyBpZiB0aGlzIHJlc291cmNlIGhhcyBmaW5pc2hlZCBsb2FkaW5nLiBJcyB0cnVlIHdoZW4gdGhlIHJlc291cmNlIGhhcyBjb21wbGV0ZWx5XG4gICAgICAgICAqIGxvYWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6ICdpc0NvbXBsZXRlJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzRmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuQ09NUExFVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlc2NyaWJlcyBpZiB0aGlzIHJlc291cmNlIGlzIGN1cnJlbnRseSBsb2FkaW5nLiBJcyB0cnVlIHdoZW4gdGhlIHJlc291cmNlIHN0YXJ0cyBsb2FkaW5nLFxuICAgICAgICAgKiBhbmQgaXMgZmFsc2UgYWdhaW4gd2hlbiBjb21wbGV0ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6ICdpc0xvYWRpbmcnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oYXNGbGFnKFJlc291cmNlLlNUQVRVU19GTEFHUy5MT0FESU5HKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZXNvdXJjZTtcbn0oKTtcblxuLyoqXG4gKiBUaGUgdHlwZXMgb2YgcmVzb3VyY2VzIGEgcmVzb3VyY2UgY291bGQgcmVwcmVzZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuXG5cbmV4cG9ydHMuZGVmYXVsdCA9IFJlc291cmNlO1xuUmVzb3VyY2UuU1RBVFVTX0ZMQUdTID0ge1xuICAgIE5PTkU6IDAsXG4gICAgREFUQV9VUkw6IDEgPDwgMCxcbiAgICBDT01QTEVURTogMSA8PCAxLFxuICAgIExPQURJTkc6IDEgPDwgMlxufTtcblxuLyoqXG4gKiBUaGUgdHlwZXMgb2YgcmVzb3VyY2VzIGEgcmVzb3VyY2UgY291bGQgcmVwcmVzZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuUmVzb3VyY2UuVFlQRSA9IHtcbiAgICBVTktOT1dOOiAwLFxuICAgIEpTT046IDEsXG4gICAgWE1MOiAyLFxuICAgIElNQUdFOiAzLFxuICAgIEFVRElPOiA0LFxuICAgIFZJREVPOiA1LFxuICAgIFRFWFQ6IDZcbn07XG5cbi8qKlxuICogVGhlIHR5cGVzIG9mIGxvYWRpbmcgYSByZXNvdXJjZSBjYW4gdXNlLlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuUmVzb3VyY2UuTE9BRF9UWVBFID0ge1xuICAgIC8qKiBVc2VzIFhNTEh0dHBSZXF1ZXN0IHRvIGxvYWQgdGhlIHJlc291cmNlLiAqL1xuICAgIFhIUjogMSxcbiAgICAvKiogVXNlcyBhbiBgSW1hZ2VgIG9iamVjdCB0byBsb2FkIHRoZSByZXNvdXJjZS4gKi9cbiAgICBJTUFHRTogMixcbiAgICAvKiogVXNlcyBhbiBgQXVkaW9gIG9iamVjdCB0byBsb2FkIHRoZSByZXNvdXJjZS4gKi9cbiAgICBBVURJTzogMyxcbiAgICAvKiogVXNlcyBhIGBWaWRlb2Agb2JqZWN0IHRvIGxvYWQgdGhlIHJlc291cmNlLiAqL1xuICAgIFZJREVPOiA0XG59O1xuXG4vKipcbiAqIFRoZSBYSFIgcmVhZHkgc3RhdGVzLCB1c2VkIGludGVybmFsbHkuXG4gKlxuICogQHN0YXRpY1xuICogQHJlYWRvbmx5XG4gKiBAZW51bSB7c3RyaW5nfVxuICovXG5SZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRSA9IHtcbiAgICAvKiogc3RyaW5nICovXG4gICAgREVGQVVMVDogJ3RleHQnLFxuICAgIC8qKiBBcnJheUJ1ZmZlciAqL1xuICAgIEJVRkZFUjogJ2FycmF5YnVmZmVyJyxcbiAgICAvKiogQmxvYiAqL1xuICAgIEJMT0I6ICdibG9iJyxcbiAgICAvKiogRG9jdW1lbnQgKi9cbiAgICBET0NVTUVOVDogJ2RvY3VtZW50JyxcbiAgICAvKiogT2JqZWN0ICovXG4gICAgSlNPTjogJ2pzb24nLFxuICAgIC8qKiBTdHJpbmcgKi9cbiAgICBURVhUOiAndGV4dCdcbn07XG5cblJlc291cmNlLl9sb2FkVHlwZU1hcCA9IHtcbiAgICAvLyBpbWFnZXNcbiAgICBnaWY6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBwbmc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBibXA6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBqcGc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBqcGVnOiBSZXNvdXJjZS5MT0FEX1RZUEUuSU1BR0UsXG4gICAgdGlmOiBSZXNvdXJjZS5MT0FEX1RZUEUuSU1BR0UsXG4gICAgdGlmZjogUmVzb3VyY2UuTE9BRF9UWVBFLklNQUdFLFxuICAgIHdlYnA6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICB0Z2E6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBzdmc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICAnc3ZnK3htbCc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSwgLy8gZm9yIFNWRyBkYXRhIHVybHNcblxuICAgIC8vIGF1ZGlvXG4gICAgbXAzOiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG4gICAgb2dnOiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG4gICAgd2F2OiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG5cbiAgICAvLyB2aWRlb3NcbiAgICBtcDQ6IFJlc291cmNlLkxPQURfVFlQRS5WSURFTyxcbiAgICB3ZWJtOiBSZXNvdXJjZS5MT0FEX1RZUEUuVklERU9cbn07XG5cblJlc291cmNlLl94aHJUeXBlTWFwID0ge1xuICAgIC8vIHhtbFxuICAgIHhodG1sOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBodG1sOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBodG06IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuICAgIHhtbDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuRE9DVU1FTlQsXG4gICAgdG14OiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBzdmc6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuXG4gICAgLy8gVGhpcyB3YXMgYWRkZWQgdG8gaGFuZGxlIFRpbGVkIFRpbGVzZXQgWE1MLCBidXQgLnRzeCBpcyBhbHNvIGEgVHlwZVNjcmlwdCBSZWFjdCBDb21wb25lbnQuXG4gICAgLy8gU2luY2UgaXQgaXMgd2F5IGxlc3MgbGlrZWx5IGZvciBwZW9wbGUgdG8gYmUgbG9hZGluZyBUeXBlU2NyaXB0IGZpbGVzIGluc3RlYWQgb2YgVGlsZWQgZmlsZXMsXG4gICAgLy8gdGhpcyBzaG91bGQgcHJvYmFibHkgYmUgZmluZS5cbiAgICB0c3g6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuXG4gICAgLy8gaW1hZ2VzXG4gICAgZ2lmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIHBuZzogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQixcbiAgICBibXA6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAganBnOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIGpwZWc6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAgdGlmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIHRpZmY6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAgd2VicDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQixcbiAgICB0Z2E6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG5cbiAgICAvLyBqc29uXG4gICAganNvbjogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuSlNPTixcblxuICAgIC8vIHRleHRcbiAgICB0ZXh0OiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5URVhULFxuICAgIHR4dDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVCxcblxuICAgIC8vIGZvbnRzXG4gICAgdHRmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVIsXG4gICAgb3RmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVJcbn07XG5cbi8vIFdlIGNhbid0IHNldCB0aGUgYHNyY2AgYXR0cmlidXRlIHRvIGVtcHR5IHN0cmluZywgc28gb24gYWJvcnQgd2Ugc2V0IGl0IHRvIHRoaXMgMXB4IHRyYW5zcGFyZW50IGdpZlxuUmVzb3VyY2UuRU1QVFlfR0lGID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQVAvLy93QUFBQ0g1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlDUkFFQU93PT0nO1xuXG4vKipcbiAqIFF1aWNrIGhlbHBlciB0byBzZXQgYSB2YWx1ZSBvbiBvbmUgb2YgdGhlIGV4dGVuc2lvbiBtYXBzLiBFbnN1cmVzIHRoZXJlIGlzIG5vXG4gKiBkb3QgYXQgdGhlIHN0YXJ0IG9mIHRoZSBleHRlbnNpb24uXG4gKlxuICogQGlnbm9yZVxuICogQHBhcmFtIHtvYmplY3R9IG1hcCAtIFRoZSBtYXAgdG8gc2V0IG9uLlxuICogQHBhcmFtIHtzdHJpbmd9IGV4dG5hbWUgLSBUaGUgZXh0ZW5zaW9uIChvciBrZXkpIHRvIHNldC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5mdW5jdGlvbiBzZXRFeHRNYXAobWFwLCBleHRuYW1lLCB2YWwpIHtcbiAgICBpZiAoZXh0bmFtZSAmJiBleHRuYW1lLmluZGV4T2YoJy4nKSA9PT0gMCkge1xuICAgICAgICBleHRuYW1lID0gZXh0bmFtZS5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgaWYgKCFleHRuYW1lKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtYXBbZXh0bmFtZV0gPSB2YWw7XG59XG5cbi8qKlxuICogUXVpY2sgaGVscGVyIHRvIGdldCBzdHJpbmcgeGhyIHR5cGUuXG4gKlxuICogQGlnbm9yZVxuICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdHxYRG9tYWluUmVxdWVzdH0geGhyIC0gVGhlIHJlcXVlc3QgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlLlxuICovXG5mdW5jdGlvbiByZXFUeXBlKHhocikge1xuICAgIHJldHVybiB4aHIudG9TdHJpbmcoKS5yZXBsYWNlKCdvYmplY3QgJywgJycpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVzb3VyY2UuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5lYWNoU2VyaWVzID0gZWFjaFNlcmllcztcbmV4cG9ydHMucXVldWUgPSBxdWV1ZTtcbi8qKlxuICogU21hbGxlciB2ZXJzaW9uIG9mIHRoZSBhc3luYyBsaWJyYXJ5IGNvbnN0cnVjdHMuXG4gKlxuICovXG5mdW5jdGlvbiBfbm9vcCgpIHt9IC8qIGVtcHR5ICovXG5cbi8qKlxuICogSXRlcmF0ZXMgYW4gYXJyYXkgaW4gc2VyaWVzLlxuICpcbiAqIEBwYXJhbSB7KltdfSBhcnJheSAtIEFycmF5IHRvIGl0ZXJhdGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBpdGVyYXRvciAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggZWxlbWVudC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGRvbmUsIG9yIG9uIGVycm9yLlxuICovXG5mdW5jdGlvbiBlYWNoU2VyaWVzKGFycmF5LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxlbiA9IGFycmF5Lmxlbmd0aDtcblxuICAgIChmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICBpZiAoZXJyIHx8IGkgPT09IGxlbikge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlcmF0b3IoYXJyYXlbaSsrXSwgbmV4dCk7XG4gICAgfSkoKTtcbn1cblxuLyoqXG4gKiBFbnN1cmVzIGEgZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiAtIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICogQHJldHVybiB7ZnVuY3Rpb259IFRoZSB3cmFwcGluZyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gb25seU9uY2UoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gICAgICAgIGlmIChmbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FsbEZuID0gZm47XG5cbiAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICBjYWxsRm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIEFzeW5jIHF1ZXVlIGltcGxlbWVudGF0aW9uLFxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHdvcmtlciAtIFRoZSB3b3JrZXIgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB0YXNrLlxuICogQHBhcmFtIHtudW1iZXJ9IGNvbmN1cnJlbmN5IC0gSG93IG1hbnkgd29ya2VycyB0byBydW4gaW4gcGFycmFsbGVsLlxuICogQHJldHVybiB7Kn0gVGhlIGFzeW5jIHF1ZXVlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgIH0gZWxzZSBpZiAoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgfVxuXG4gICAgdmFyIHdvcmtlcnMgPSAwO1xuICAgIHZhciBxID0ge1xuICAgICAgICBfdGFza3M6IFtdLFxuICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgIHNhdHVyYXRlZDogX25vb3AsXG4gICAgICAgIHVuc2F0dXJhdGVkOiBfbm9vcCxcbiAgICAgICAgYnVmZmVyOiBjb25jdXJyZW5jeSAvIDQsXG4gICAgICAgIGVtcHR5OiBfbm9vcCxcbiAgICAgICAgZHJhaW46IF9ub29wLFxuICAgICAgICBlcnJvcjogX25vb3AsXG4gICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KGRhdGEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIGtpbGw6IGZ1bmN0aW9uIGtpbGwoKSB7XG4gICAgICAgICAgICB3b3JrZXJzID0gMDtcbiAgICAgICAgICAgIHEuZHJhaW4gPSBfbm9vcDtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcS5fdGFza3MgPSBbXTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gdW5zaGlmdChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgX2luc2VydChkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIHByb2Nlc3MoKSB7XG4gICAgICAgICAgICB3aGlsZSAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEuX3Rhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXNrID0gcS5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIGlmIChxLl90YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcblxuICAgICAgICAgICAgICAgIGlmICh3b3JrZXJzID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd29ya2VyKHRhc2suZGF0YSwgb25seU9uY2UoX25leHQodGFzaykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiBsZW5ndGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5fdGFza3MubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiBydW5uaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIGlkbGU6IGZ1bmN0aW9uIGlkbGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5fdGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMDtcbiAgICAgICAgfSxcbiAgICAgICAgcGF1c2U6IGZ1bmN0aW9uIHBhdXNlKCkge1xuICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3VtZTogZnVuY3Rpb24gcmVzdW1lKCkge1xuICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcS5wYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gTmVlZCB0byBjYWxsIHEucHJvY2VzcyBvbmNlIHBlciBjb25jdXJyZW50XG4gICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcS5jb25jdXJyZW5jeTsgdysrKSB7XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2luc2VydChkYXRhLCBpbnNlcnRBdEZyb250LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKGRhdGEgPT0gbnVsbCAmJiBxLmlkbGUoKSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lcS1udWxsLGVxZXFlcVxuICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLmRyYWluKCk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogX25vb3BcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW5zZXJ0QXRGcm9udCkge1xuICAgICAgICAgICAgcS5fdGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEuX3Rhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnByb2Nlc3MoKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX25leHQodGFzaykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgdGFzay5jYWxsYmFjay5hcHBseSh0YXNrLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzWzBdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVxLW51bGwsZXFlcWVxXG4gICAgICAgICAgICAgICAgcS5lcnJvcihhcmd1bWVudHNbMF0sIHRhc2suZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3b3JrZXJzIDw9IHEuY29uY3VycmVuY3kgLSBxLmJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHEudW5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFzeW5jLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuZW5jb2RlQmluYXJ5ID0gZW5jb2RlQmluYXJ5O1xudmFyIF9rZXlTdHIgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuXG5mdW5jdGlvbiBlbmNvZGVCaW5hcnkoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gJyc7XG4gICAgdmFyIGlueCA9IDA7XG5cbiAgICB3aGlsZSAoaW54IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIC8vIEZpbGwgYnl0ZSBidWZmZXIgYXJyYXlcbiAgICAgICAgdmFyIGJ5dGVidWZmZXIgPSBbMCwgMCwgMF07XG4gICAgICAgIHZhciBlbmNvZGVkQ2hhckluZGV4ZXMgPSBbMCwgMCwgMCwgMF07XG5cbiAgICAgICAgZm9yICh2YXIgam54ID0gMDsgam54IDwgYnl0ZWJ1ZmZlci5sZW5ndGg7ICsram54KSB7XG4gICAgICAgICAgICBpZiAoaW54IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYXdheSBoaWdoLW9yZGVyIGJ5dGUsIGFzIGRvY3VtZW50ZWQgYXQ6XG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vVXNpbmdfWE1MSHR0cFJlcXVlc3QjSGFuZGxpbmdfYmluYXJ5X2RhdGFcbiAgICAgICAgICAgICAgICBieXRlYnVmZmVyW2pueF0gPSBpbnB1dC5jaGFyQ29kZUF0KGlueCsrKSAmIDB4ZmY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJ5dGVidWZmZXJbam54XSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgZWFjaCBlbmNvZGVkIGNoYXJhY3RlciwgNiBiaXRzIGF0IGEgdGltZVxuICAgICAgICAvLyBpbmRleCAxOiBmaXJzdCA2IGJpdHNcbiAgICAgICAgZW5jb2RlZENoYXJJbmRleGVzWzBdID0gYnl0ZWJ1ZmZlclswXSA+PiAyO1xuXG4gICAgICAgIC8vIGluZGV4IDI6IHNlY29uZCA2IGJpdHMgKDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBmcm9tIGlucHV0IGJ5dGUgMSArIDQgbW9zdCBzaWduaWZpY2FudCBiaXRzIGZyb20gYnl0ZSAyKVxuICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMV0gPSAoYnl0ZWJ1ZmZlclswXSAmIDB4MykgPDwgNCB8IGJ5dGVidWZmZXJbMV0gPj4gNDtcblxuICAgICAgICAvLyBpbmRleCAzOiB0aGlyZCA2IGJpdHMgKDQgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBmcm9tIGlucHV0IGJ5dGUgMiArIDIgbW9zdCBzaWduaWZpY2FudCBiaXRzIGZyb20gYnl0ZSAzKVxuICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMl0gPSAoYnl0ZWJ1ZmZlclsxXSAmIDB4MGYpIDw8IDIgfCBieXRlYnVmZmVyWzJdID4+IDY7XG5cbiAgICAgICAgLy8gaW5kZXggMzogZm9ydGggNiBiaXRzICg2IGxlYXN0IHNpZ25pZmljYW50IGJpdHMgZnJvbSBpbnB1dCBieXRlIDMpXG4gICAgICAgIGVuY29kZWRDaGFySW5kZXhlc1szXSA9IGJ5dGVidWZmZXJbMl0gJiAweDNmO1xuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHBhZGRpbmcgaGFwcGVuZWQsIGFuZCBhZGp1c3QgYWNjb3JkaW5nbHlcbiAgICAgICAgdmFyIHBhZGRpbmdCeXRlcyA9IGlueCAtIChpbnB1dC5sZW5ndGggLSAxKTtcblxuICAgICAgICBzd2l0Y2ggKHBhZGRpbmdCeXRlcykge1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIC8vIFNldCBsYXN0IDIgY2hhcmFjdGVycyB0byBwYWRkaW5nIGNoYXJcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbM10gPSA2NDtcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMl0gPSA2NDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIC8vIFNldCBsYXN0IGNoYXJhY3RlciB0byBwYWRkaW5nIGNoYXJcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbM10gPSA2NDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gTm8gcGFkZGluZyAtIHByb2NlZWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyB3ZSB3aWxsIGdyYWIgZWFjaCBhcHByb3ByaWF0ZSBjaGFyYWN0ZXIgb3V0IG9mIG91ciBrZXlzdHJpbmdcbiAgICAgICAgLy8gYmFzZWQgb24gb3VyIGluZGV4IGFycmF5IGFuZCBhcHBlbmQgaXQgdG8gdGhlIG91dHB1dCBzdHJpbmdcbiAgICAgICAgZm9yICh2YXIgX2pueCA9IDA7IF9qbnggPCBlbmNvZGVkQ2hhckluZGV4ZXMubGVuZ3RoOyArK19qbngpIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBfa2V5U3RyLmNoYXJBdChlbmNvZGVkQ2hhckluZGV4ZXNbX2pueF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWI2NC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfTG9hZGVyID0gcmVxdWlyZSgnLi9Mb2FkZXInKTtcblxudmFyIF9Mb2FkZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTG9hZGVyKTtcblxudmFyIF9SZXNvdXJjZSA9IHJlcXVpcmUoJy4vUmVzb3VyY2UnKTtcblxudmFyIF9SZXNvdXJjZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9SZXNvdXJjZSk7XG5cbnZhciBfYXN5bmMgPSByZXF1aXJlKCcuL2FzeW5jJyk7XG5cbnZhciBhc3luYyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9hc3luYyk7XG5cbnZhciBfYiA9IHJlcXVpcmUoJy4vYjY0Jyk7XG5cbnZhciBiNjQgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfYik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbl9Mb2FkZXIyLmRlZmF1bHQuUmVzb3VyY2UgPSBfUmVzb3VyY2UyLmRlZmF1bHQ7XG5fTG9hZGVyMi5kZWZhdWx0LmFzeW5jID0gYXN5bmM7XG5fTG9hZGVyMi5kZWZhdWx0LmJhc2U2NCA9IGI2NDtcblxuLy8gZXhwb3J0IG1hbnVhbGx5LCBhbmQgYWxzbyBhcyBkZWZhdWx0XG5tb2R1bGUuZXhwb3J0cyA9IF9Mb2FkZXIyLmRlZmF1bHQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbmV4cG9ydHMuZGVmYXVsdCA9IF9Mb2FkZXIyLmRlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIE1pbmlTaWduYWxCaW5kaW5nID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTWluaVNpZ25hbEJpbmRpbmcoZm4sIG9uY2UsIHRoaXNBcmcpIHtcbiAgICBpZiAob25jZSA9PT0gdW5kZWZpbmVkKSBvbmNlID0gZmFsc2U7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTWluaVNpZ25hbEJpbmRpbmcpO1xuXG4gICAgdGhpcy5fZm4gPSBmbjtcbiAgICB0aGlzLl9vbmNlID0gb25jZTtcbiAgICB0aGlzLl90aGlzQXJnID0gdGhpc0FyZztcbiAgICB0aGlzLl9uZXh0ID0gdGhpcy5fcHJldiA9IHRoaXMuX293bmVyID0gbnVsbDtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhNaW5pU2lnbmFsQmluZGluZywgW3tcbiAgICBrZXk6ICdkZXRhY2gnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXRhY2goKSB7XG4gICAgICBpZiAodGhpcy5fb3duZXIgPT09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICAgIHRoaXMuX293bmVyLmRldGFjaCh0aGlzKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBNaW5pU2lnbmFsQmluZGluZztcbn0pKCk7XG5cbmZ1bmN0aW9uIF9hZGRNaW5pU2lnbmFsQmluZGluZyhzZWxmLCBub2RlKSB7XG4gIGlmICghc2VsZi5faGVhZCkge1xuICAgIHNlbGYuX2hlYWQgPSBub2RlO1xuICAgIHNlbGYuX3RhaWwgPSBub2RlO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuX3RhaWwuX25leHQgPSBub2RlO1xuICAgIG5vZGUuX3ByZXYgPSBzZWxmLl90YWlsO1xuICAgIHNlbGYuX3RhaWwgPSBub2RlO1xuICB9XG5cbiAgbm9kZS5fb3duZXIgPSBzZWxmO1xuXG4gIHJldHVybiBub2RlO1xufVxuXG52YXIgTWluaVNpZ25hbCA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIE1pbmlTaWduYWwoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1pbmlTaWduYWwpO1xuXG4gICAgdGhpcy5faGVhZCA9IHRoaXMuX3RhaWwgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTWluaVNpZ25hbCwgW3tcbiAgICBrZXk6ICdoYW5kbGVycycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhbmRsZXJzKCkge1xuICAgICAgdmFyIGV4aXN0cyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICB2YXIgbm9kZSA9IHRoaXMuX2hlYWQ7XG5cbiAgICAgIGlmIChleGlzdHMpIHJldHVybiAhIW5vZGU7XG5cbiAgICAgIHZhciBlZSA9IFtdO1xuXG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBlZS5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2hhcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhcyhub2RlKSB7XG4gICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgTWluaVNpZ25hbEJpbmRpbmcpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWluaVNpZ25hbCNoYXMoKTogRmlyc3QgYXJnIG11c3QgYmUgYSBNaW5pU2lnbmFsQmluZGluZyBvYmplY3QuJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2RlLl9vd25lciA9PT0gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkaXNwYXRjaCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRpc3BhdGNoKCkge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLl9oZWFkO1xuXG4gICAgICBpZiAoIW5vZGUpIHJldHVybiBmYWxzZTtcblxuICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuX29uY2UpIHRoaXMuZGV0YWNoKG5vZGUpO1xuICAgICAgICBub2RlLl9mbi5hcHBseShub2RlLl90aGlzQXJnLCBhcmd1bWVudHMpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnYWRkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkKGZuKSB7XG4gICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaW5pU2lnbmFsI2FkZCgpOiBGaXJzdCBhcmcgbXVzdCBiZSBhIEZ1bmN0aW9uLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9hZGRNaW5pU2lnbmFsQmluZGluZyh0aGlzLCBuZXcgTWluaVNpZ25hbEJpbmRpbmcoZm4sIGZhbHNlLCB0aGlzQXJnKSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb25jZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbmlTaWduYWwjb25jZSgpOiBGaXJzdCBhcmcgbXVzdCBiZSBhIEZ1bmN0aW9uLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9hZGRNaW5pU2lnbmFsQmluZGluZyh0aGlzLCBuZXcgTWluaVNpZ25hbEJpbmRpbmcoZm4sIHRydWUsIHRoaXNBcmcpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkZXRhY2gnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIE1pbmlTaWduYWxCaW5kaW5nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbmlTaWduYWwjZGV0YWNoKCk6IEZpcnN0IGFyZyBtdXN0IGJlIGEgTWluaVNpZ25hbEJpbmRpbmcgb2JqZWN0LicpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUuX293bmVyICE9PSB0aGlzKSByZXR1cm4gdGhpcztcblxuICAgICAgaWYgKG5vZGUuX3ByZXYpIG5vZGUuX3ByZXYuX25leHQgPSBub2RlLl9uZXh0O1xuICAgICAgaWYgKG5vZGUuX25leHQpIG5vZGUuX25leHQuX3ByZXYgPSBub2RlLl9wcmV2O1xuXG4gICAgICBpZiAobm9kZSA9PT0gdGhpcy5faGVhZCkge1xuICAgICAgICB0aGlzLl9oZWFkID0gbm9kZS5fbmV4dDtcbiAgICAgICAgaWYgKG5vZGUuX25leHQgPT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl90YWlsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChub2RlID09PSB0aGlzLl90YWlsKSB7XG4gICAgICAgIHRoaXMuX3RhaWwgPSBub2RlLl9wcmV2O1xuICAgICAgICB0aGlzLl90YWlsLl9uZXh0ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgbm9kZS5fb3duZXIgPSBudWxsO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGV0YWNoQWxsJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGV0YWNoQWxsKCkge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLl9oZWFkO1xuICAgICAgaWYgKCFub2RlKSByZXR1cm4gdGhpcztcblxuICAgICAgdGhpcy5faGVhZCA9IHRoaXMuX3RhaWwgPSBudWxsO1xuXG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBub2RlLl9vd25lciA9IG51bGw7XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIE1pbmlTaWduYWw7XG59KSgpO1xuXG5NaW5pU2lnbmFsLk1pbmlTaWduYWxCaW5kaW5nID0gTWluaVNpZ25hbEJpbmRpbmc7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IE1pbmlTaWduYWw7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlVVJJIChzdHIsIG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge31cblxuICB2YXIgbyA9IHtcbiAgICBrZXk6IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2FuY2hvciddLFxuICAgIHE6IHtcbiAgICAgIG5hbWU6ICdxdWVyeUtleScsXG4gICAgICBwYXJzZXI6IC8oPzpefCYpKFteJj1dKik9PyhbXiZdKikvZ1xuICAgIH0sXG4gICAgcGFyc2VyOiB7XG4gICAgICBzdHJpY3Q6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8sXG4gICAgICBsb29zZTogL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopKD86OihbXjpAXSopKT8pP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvXG4gICAgfVxuICB9XG5cbiAgdmFyIG0gPSBvLnBhcnNlcltvcHRzLnN0cmljdE1vZGUgPyAnc3RyaWN0JyA6ICdsb29zZSddLmV4ZWMoc3RyKVxuICB2YXIgdXJpID0ge31cbiAgdmFyIGkgPSAxNFxuXG4gIHdoaWxlIChpLS0pIHVyaVtvLmtleVtpXV0gPSBtW2ldIHx8ICcnXG5cbiAgdXJpW28ucS5uYW1lXSA9IHt9XG4gIHVyaVtvLmtleVsxMl1dLnJlcGxhY2Uoby5xLnBhcnNlciwgZnVuY3Rpb24gKCQwLCAkMSwgJDIpIHtcbiAgICBpZiAoJDEpIHVyaVtvLnEubmFtZV1bJDFdID0gJDJcbiAgfSlcblxuICByZXR1cm4gdXJpXG59XG4iXX0=
