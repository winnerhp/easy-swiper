'use strict';

(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports', 'module'], factory);
    } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        factory(exports, module);
    } else {
        var mod = { exports: {} };
        factory(mod.exports, mod);
        global.easySwiper = mod.exports;
    }
})(undefined, function (exports, module) {
    // 简易工具函数
    var UTILS = {
        hasClass: function hasClass(el, cls) {
            if (el.classList) return el.classList.contains(cls);
            return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
        },
        removeClass: function removeClass(el, cls) {
            if (el.classList) {
                el.classList.remove(cls);
                return;
            }
            if (this.hasClass(el, cls)) {
                var curClass = ' ' + el.className + ' ';
                curClass = curClass.replace(' ' + clsName + ' ', ' ');
                el.className = trim(curClass);
            }
        },
        addClass: function addClass(el, cls) {
            if (el.classList) {
                el.classList.add(cls);
                return;
            }
            if (!hasClass(el, cls)) {
                el.className = el.className + ' ' + cls;
            }
        }
    };
    // transitionend handler
    var EVENT = {
        timeHandle: '',
        addOnce: function addOnce(el, event, handler) {
            var listener = function listener() {
                if (EVENT.timeHandle) clearTimeout(EVENT.timeHandle);
                EVENT.timeHandle = setTimeout(function () {
                    handler.apply(this, arguments);
                }, 5e2);
                EVENT.remove(el, event, listener);
            };
            el.addEventListener(event, listener, false);
        },
        remove: function remove(el, event, handler) {
            el.removeEventListener(event, handler, false);
        }
    };
    function easyswiper(params) {
        this.$el = params.element;
        this.initNum = params.initNum || 0;
        this.params = params;
        this.$child = null;
        this.numDom = null;
        this.x = this.y = null;
        this.delta = null;
        this.now = null;
        this.canscroll = false;
        this.canswipe = false;
        this.baseWidth = document.body.clientWidth;
        this.autoPlay = params.autoPlay || null;
        this._init()._emit('onInit', {
            dom: this.current.dom,
            num: this.current.num
        });
    }
    easyswiper.prototype = {
        _init: function _init() {
            this._bindEvents();
            this.$child = Array.prototype.slice.call(this.$el.children);
            this.numDom = this.$child.length - 1;
            this._initPage(this.initNum, 'first');
            this._resetStyle();
            if (this.autoPlay) this._autoPlay();
            return this;
        },
        _autoPlay: function _autoPlay() {
            var _this = this;

            this.interval ? clearInterval(this.interval) : '';
            this.interval = setInterval(function () {
                _this._doAnimate('next');
            }, 5e3);
        },
        _emit: function _emit(event, obj) {
            if (this.params[event]) {
                this.params[event](obj);
            }
        },
        _bindEvents: function _bindEvents() {
            var _this2 = this;

            'touchstart touchmove touchend touchcancel'.split(' ').forEach(function (item) {
                _this2.$el.addEventListener(item, _this2['_' + item].bind(_this2), false);
            });
        },
        _getDomlist: function _getDomlist(initNum) {
            initNum = Number(initNum);
            this.current = {
                dom: this.$child[initNum],
                num: initNum
            };
            this.prev = {
                dom: initNum - 1 > -1 ? this.$child[initNum - 1] : this.autoPlay ? this.$child[this.numDom] : '',
                num: initNum - 1 > -1 ? initNum - 1 : this.autoPlay ? this.numDom : ''
            };
            this.next = {
                dom: initNum + 1 > this.numDom ? this.autoPlay ? this.$child[0] : '' : this.$child[initNum + 1],
                num: initNum + 1 > this.numDom ? this.autoPlay ? 0 : '' : initNum + 1
            };
        },
        _initPage: function _initPage(index, callback) {
            var _this3 = this;

            this.delta = null;
            this.canscroll = this.canswipe = false;
            this._getDomlist(index);
            UTILS.addClass(this.current.dom, 'active');
            if (typeof callback == 'string' && callback) return;
            this._emit('onChangeBegin', {
                dom: this.current.dom,
                num: this.current.num
            });

            var animationCb = function animationCb() {
                if (typeof callback == 'function') {
                    callback();
                }
                if (_this3.autoPlay) {
                    _this3._resetStyle();
                }
                _this3._emit('onChangeEnd', {
                    dom: _this3.current.dom,
                    num: _this3.current.num
                });
            };
            EVENT.addOnce(this.current.dom, 'webkitTransitionEnd', animationCb);
        },
        _resetStyle: function _resetStyle(type) {
            var _this4 = this;

            var curNum = this.current.num;
            if (this.autoPlay) {
                this._translate([[this.current.dom, 0, 0], [this.next.dom, this.baseWidth, 0], [this.prev.dom, -this.baseWidth, 0]]);
                return;
            }
            this.$child.forEach(function (item, index) {
                if (curNum == index) {
                    _this4._translate(item, 0, 0);
                } else if (index > curNum) {
                    _this4._translate(item, _this4.baseWidth, 0);
                } else {
                    _this4._translate(item, -_this4.baseWidth, 0);
                }
            });
        },
        _touchstart: function _touchstart(event) {
            this.now = Date.now();
            this.x = event.touches[0].pageX;
            this.y = event.touches[0].pageY;
        },
        _touchmove: function _touchmove(event) {
            // on native scroll 事件
            if (this.canscroll || event.touches.length > 1) return;
            var cTouch = event.touches[0];
            this.delta = cTouch.pageX - this.x;
            // Y轴偏移大于X轴
            if (!this.canswipe) {
                if (Math.abs(cTouch.pageY - this.y) > Math.abs(this.delta)) {
                    this.canscroll = true;
                    this.canswipe = false;
                    return;
                }
                this.canswipe = true;
            }
            event.preventDefault();
            event.stopPropagation();
            if (this.autoPlay) clearInterval(this.interval);
            // 兼容头条ios客户端滑至上边界touchend和touchcancel不能触发
            if (!this.autoPlay && cTouch.pageY < 0) {
                this._touchend();
                return;
            }
            this._translate(this.current.dom, this.delta, 0);
            this.prev.dom && this._translate(this.prev.dom, this.delta - this.baseWidth, 0);
            this.next.dom && this._translate(this.next.dom, this.delta + this.baseWidth, 0);
        },
        _touchcancel: function _touchcancel(event) {
            this._touchend();
        },
        _touchend: function _touchend(event) {
            if (this.autoPlay) this._autoPlay();
            if (this.canscroll) {
                this.canscroll = false;
                return;
            }
            if (!this.delta) {
                return;
            }
            var min = this.baseWidth / 3,
                move = this.delta,
                speed = move / (Date.now() - this.now);
            if (move > min || speed > .5) {
                this._doAnimate('prev');
                return;
            }
            if (-move > min || speed < -.5) {
                this._doAnimate('next');
                return;
            }
            this._doAnimate('current');
        }
    };
    easyswiper.prototype.gotoPage = function (newindex) {
        var _this5 = this;

        if (newindex < 0 || newindex > this.numDom || newindex == this.current.num || this.autoPlay) return;
        var curIndex = this.current.num;
        UTILS.removeClass(this.current.dom, 'active');
        if (curIndex > newindex) {
            this._doAnimate('prev', {
                index: newindex,
                domlist: [[this.$child[newindex], 0, 300], [this.current.dom, this.baseWidth, 300]],
                callback: function callback() {
                    _this5._resetStyle();
                }
            });
        }
        if (curIndex < newindex) {
            this._doAnimate('next', {
                index: newindex,
                domlist: [[this.$child[newindex], 0, 300], [this.current.dom, -this.baseWidth, 300]],
                callback: function callback() {
                    _this5._resetStyle();
                }
            });
        }
    };
    easyswiper.prototype._translate = function (element, offset, speed) {
        if (!element) return;
        if (element.length > 1) {
            element.forEach(function (item) {
                if (!item[0]) return;
                item[0].style.webkitTransform = 'translateX(' + item[1] + 'px)';
                item[0].style.webkitTransition = '-webkit-transform ' + item[2] + 'ms linear';
            });
            return;
        }
        element.style.webkitTransform = 'translateX(' + offset + 'px)';
        element.style.webkitTransition = '-webkit-transform ' + speed + 'ms linear';
    };
    easyswiper.prototype._doAnimate = function (towards, options) {
        var curIndex = this.current.num;
        UTILS.removeClass(this.current.dom, 'active');
        if (towards == 'prev' && this.prev.dom) {
            this._translate(options ? options.domlist : [[this.prev.dom, 0, 300], [this.current.dom, this.baseWidth, 300], [this.next.dom, this.baseWidth, 0]]);
            curIndex = options ? options.index : curIndex - 1 < 0 && this.autoPlay ? this.numDom : curIndex - 1;
            this._initPage(curIndex, options ? options.callback : '');
        } else if (towards == 'next' && this.next.dom) {
            this._translate(options ? options.domlist : [[this.next.dom, 0, 300], [this.current.dom, -this.baseWidth, 300], [this.prev.dom, -this.baseWidth, 0]]);
            curIndex = options ? options.index : curIndex + 1 > this.numDom && this.autoPlay ? 0 : curIndex + 1;
            this._initPage(curIndex, options ? options.callback : '');
        } else {
            this._translate([[this.current.dom, 0, 300], [this.prev.dom, -this.baseWidth, 300], [this.next.dom, this.baseWidth, 300]]);
            this._initPage(curIndex, 'current');
        }
    };
    module.exports = easyswiper;
});