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
})(this, function (exports, module) {
    // 简易工具函数
    var UTILS = {
        hasClass(el,cls) {
            if (el.classList) return el.classList.contains(cls);
            return (` ${el.className} `).indexOf(` ${cls} `) > -1;
        },
        removeClass(el,cls) {
            if (el.classList) {
                el.classList.remove(cls);
                return
            }
            if (this.hasClass(el, cls)) {
                let curClass = ` ${el.className} `;
                curClass = curClass.replace(` ${clsName} `, ' ');
                el.className = trim(curClass);
            }
        },
        addClass(el,cls) {
            if (el.classList) {
                el.classList.add(cls);
                return
            }
            if (!hasClass(el, cls)) {
                el.className = `${el.className} ${cls}`;
            }
        }
    }
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
        this._init()
            ._emit('onInit',{
                dom: this.current.dom,
                num: this.current.num
            })
    }
    easyswiper.prototype = {
        _init() {
            this._bindEvents();
            this.$child = Array.prototype.slice.call(this.$el.children);
            this.numDom = this.$child.length;
            this._initPage(this.initNum,'first');
            this._resetStyle();
            if(this.autoPlay) this._autoPlay();
            return this
        },
        _autoPlay() {
            this.interval = setInterval(() => {
                this._doAnimate('next')
            },5e3)
        },
        _emit(event,obj) {
            if(this.params[event]) {
                this.params[event](obj)
            }
        },
        _bindEvents() {
            'touchstart touchmove touchend touchcancel'.split(' ').forEach((item) => {
                this.$el.addEventListener(item,this[`_${item}`].bind(this),false)
            })
        },
        _getDomlist(initNum) {
            initNum = Number(initNum);
            this.current = {
                dom: this.$child[initNum],
                num: initNum
            }
            this.prev = {
                dom: (initNum - 1 > -1) ? this.$child[initNum - 1] : (this.autoPlay ? this.$child[this.numDom - 1] : ''),
                num: (initNum - 1 > -1) ? initNum - 1 : (this.autoPlay ? this.numDom - 1 : '')
            }
            this.next = {
                dom: (initNum + 1 > this.numDom - 1) ? (this.autoPlay ? this.$child[0] : '') : this.$child[initNum + 1],
                num: (initNum + 1 > this.numDom - 1) ? (this.autoPlay ? 0 : '') : initNum + 1
            }
        },
        _initPage(index,callback) {
            this.delta = null;
            this.canscroll = this.canswipe = false;
            this._getDomlist(index);
            UTILS.addClass(this.current.dom,'active');
            if(typeof(callback) == 'string' && callback) return
            this._emit('onChangeBegin',{
                dom: this.current.dom,
                num: this.current.num
            });
            let animationCb = () => {
                if(typeof(callback) == 'function') {
                    callback()
                }
                if(this.autoPlay && (this.current.num == this.numDom - 1 || this.current.num == 1 || this.current.num == 0)) {
                    this._resetStyle('auto');
                }
                this._emit('onChangeEnd',{
                    dom: this.current.dom,
                    num: this.current.num
                });
                this.current.dom.removeEventListener('webkitTransitionEnd',animationCb,false)
            }
            this.current.dom.addEventListener('webkitTransitionEnd',animationCb,false)
        },
        _resetStyle(type) {
            var curNum = this.current.num;
            this.$child.forEach((item,index) => {
                if(type) {
                    if(curNum == index) {
                        this._translate(item,0,0);
                    } else {
                        this._translate(item,this.baseWidth,0);
                    }
                    return
                }
                if(curNum == index) {
                    this._translate(item,0,0);
                } else if (index > curNum) {
                    this._translate(item,this.baseWidth,0);
                } else {
                    this._translate(item,-this.baseWidth,0);
                }
            })
        },
        _touchstart(event) {
            this.now = Date.now();
            this.x = event.touches[0].pageX;
            this.y = event.touches[0].pageY;
        },
        _touchmove(event) {
            // on native scroll 事件
            if(this.canscroll || event.touches.length > 1) return
            var cTouch = event.touches[0];
            this.delta = cTouch.pageX - this.x;
            // Y轴偏移大于X轴
            if(!this.canswipe) {
                if(Math.abs(cTouch.pageY - this.y) > Math.abs(this.delta)) {
                    this.canscroll = true;
                    this.canswipe = false;
                    return
                }
                this.canswipe = true;
            }
            event.preventDefault();
            event.stopPropagation();
            if(this.autoPlay) clearInterval(this.interval);
            // 兼容ios滑至上边界touchend和touchcancel不能触发
            if (!this.autoPlay && cTouch.pageY < 0) {
                this._touchend();
                return
            }
            this._translate(this.current.dom,this.delta,0);
            this.prev.dom && this._translate(this.prev.dom,this.delta - this.baseWidth,0);
            this.next.dom && this._translate(this.next.dom,this.delta + this.baseWidth,0);
        },
        _touchcancel(event) {
            this._touchend()
        },
        _touchend(event) {
            if(this.autoPlay) this._autoPlay()
            if(this.canscroll) {
                this.canscroll = false;
                return
            }
            var min = this.baseWidth/3,
                move = this.delta,
                speed = move/(Date.now() - this.now);
            if(move > min || speed > .5) {
                this._doAnimate('prev');
                return
            }
            if(-move > min || speed < -.5) {
                this._doAnimate('next');
                return
            }
            this._doAnimate('current')
        }
    }
    easyswiper.prototype.gotoPage = function(newindex) {
        if(newindex < 0 || newindex > this.numDom - 1 || newindex == this.current.num || this.autoPlay) 
            return
        var curIndex = this.current.num;
        UTILS.removeClass(this.current.dom,'active');
        if(curIndex > newindex) {
            this._doAnimate('prev',{
                index: newindex,
                domlist: [[this.$child[newindex],0,300],[this.current.dom,this.baseWidth,300]],
                callback: () => {this._resetStyle()}
            });
        }
        if(curIndex < newindex) {
            this._doAnimate('next',{
                index: newindex,
                domlist: [[this.$child[newindex],0,300],[this.current.dom,-this.baseWidth,300]],
                callback: () => {this._resetStyle()}
            });
        }
    }
    easyswiper.prototype._translate = (element, offset, speed) => {
        if(!element) return
        if(element.length > 1) {
            element.forEach((item) => {
                if(!item[0]) return;
                item[0].style.webkitTransform = `translateX(${item[1]}px)`;
                item[0].style.webkitTransition = `-webkit-transform ${item[2]}ms linear`;
            })
            return
        }
        element.style.webkitTransform = `translateX(${offset}px)`;
        element.style.webkitTransition = `-webkit-transform ${speed}ms linear`;
    }
    easyswiper.prototype._doAnimate = function(towards, options) {
        var curIndex = this.current.num;
        UTILS.removeClass(this.current.dom,'active');
        if(towards == 'prev' && this.prev.dom) {
            this._translate(options ? options.domlist : [[this.prev.dom,0,300],[this.current.dom,this.baseWidth,300],[this.next.dom,this.baseWidth,0]])
            curIndex = options ? options.index : (curIndex - 1 < 0 && this.autoPlay ? this.numDom - 1 : curIndex - 1);
            this._initPage(curIndex,options ? options.callback : '')
        } else if (towards == 'next' && this.next.dom) {
            this._translate(options ? options.domlist : [[this.next.dom,0,300],[this.current.dom,-this.baseWidth,300],[this.prev.dom,-this.baseWidth,0]]);
            curIndex = options ? options.index : (curIndex + 1 > this.numDom - 1 && this.autoPlay ? 0 : curIndex + 1);
            this._initPage(curIndex,options ? options.callback : '')
        } else {
            this._translate([[this.current.dom,0,300],[this.prev.dom,-this.baseWidth,300],[this.next.dom,this.baseWidth,300]]);
            this._initPage(curIndex,'current')
        }
    }
    module.exports = easyswiper
})