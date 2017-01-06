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
    // transitionend handler
    var EVENT = {
        timeHandle: '',
        addOnce(el,event,handler) {
            var listener = function () {
                if(EVENT.timeHandle) clearTimeout(EVENT.timeHandle);
                EVENT.timeHandle = setTimeout(function() {
                    handler.apply(this, arguments);
                },5e2)
                EVENT.remove(el,event,listener)
            }
            el.addEventListener(event,listener,false);
        },
        remove(el,event,handler) {
            el.removeEventListener(event,handler,false);
        }
    }
    function easyswiper(params) {
        this.$el = params.element;
        this.$childs = Array.prototype.slice.call(this.$el.children);
        this.childNum = this.$childs.length;
        this.initNum = params.initNum || 0;
        this.params = params;
        this.curPos = 0;
        this.curIdx = 0;
        this.x = this.y = null;
        this.delta = null;
        this.now = null;
        this.canscroll = false;
        this.canswipe = false;
        this.baseWidth = document.body.clientWidth;
        this.totalWidth = this.baseWidth*this.childNum;
        this._init()
            ._emit('onInit',{
                dom: this.$childs[this.curIdx],
                num: this.curIdx
            })
    }
    easyswiper.prototype = {
        _init() {
            this._initStyle()._bindEvents();
            this._initPage(this.initNum,'first');
            this._resetStyle();
            return this
        },
        _initStyle() {
            this.$el.style.width = `${this.totalWidth}px`;
            this.$childs.forEach((item) => {
                item.style.width = `${this.baseWidth}px`;
            })
            return this
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
        _setIndex(index) {
            if(this.curIdx == index) {
                return
            } else if (this.curIdx < index) {
                this.curPos = this.curPos - Math.abs(this.curIdx - index)*this.baseWidth
            } else {
                this.curPos = this.curPos + Math.abs(this.curIdx - index)*this.baseWidth
            }
            this.curIdx = index
        },
        _initPage(index,callback) {
            this.delta = null;
            this.canscroll = this.canswipe = false;
            this._setIndex(index);
            if(typeof(callback) == 'string' && callback) return
            this._emit('onChangeBegin',{
                dom: this.$childs[this.curIdx],
                num: this.curIdx
            });
            let animationCb = () => {
                if(typeof(callback) == 'function') {
                    callback()
                }
                this._emit('onChangeEnd',{
                    dom: this.$childs[this.curIdx],
                    num: this.curIdx
                });
            }
            EVENT.addOnce(this.$el,'webkitTransitionEnd',animationCb)
        },
        _resetStyle(type) {
            var index = this.curIdx;
            this.$el.style.webkitTransform = `translateX(${-index*this.baseWidth}px)`
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
            // 兼容头条ios客户端滑至上边界touchend和touchcancel不能触发
            if (cTouch.pageY < 0) {
                this._touchend();
                return
            }
            this._translate(this.$el,this.delta,0);
        },
        _touchcancel(event) {
            this._touchend()
        },
        _touchend(event) {
            if(this.canscroll) {
                this.canscroll = false;
                return
            }
            if(!this.delta) {
                return
            }
            var min = this.baseWidth/3,
                move = this.delta,
                speed = move/(Date.now() - this.now);
            if((move > min || speed > .5) && this.curPos < 0 ) {
                this._doAnimate('prev');
                return
            }
            if((-move > min || speed < -.5) && this.curPos > -(this.totalWidth-this.baseWidth) ) {
                this._doAnimate('next');
                return
            }
            this._doAnimate('current')
        }
    }
    easyswiper.prototype.gotoPage = function(newindex) {
        if(newindex < 0 || newindex > (this.childNum - 1) || newindex == this.curIdx) 
            return
        var curIndex = this.curIdx;
        if(curIndex > newindex) {
            this._doAnimate('prev',{
                targetIdx: newindex
            });
        }
        if(curIndex < newindex) {
            this._doAnimate('next',{
                targetIdx: newindex
            });
        }
    }
    easyswiper.prototype._translate = function(ele,offset, speed) {
        ele.style.webkitTransform = `translateX(${(speed ? 0 : this.curPos) + offset}px)`;
        ele.style.webkitTransition = `-webkit-transform ${speed}ms linear`;
    }
    easyswiper.prototype._doAnimate = function(towards, options) {
        var index = this.curIdx;
        if(towards == 'prev') {
            this._translate(this.$el,options ? this.curPos + Math.abs(options.targetIdx-index)*this.baseWidth : this.curPos + this.baseWidth,300);
            this._initPage(options ? options.targetIdx : index-1);
        } else if (towards == 'next') {
            this._translate(this.$el,options ? -options.targetIdx*this.baseWidth : -(index+1)*this.baseWidth,300);
            this._initPage(options ? options.targetIdx : index+1);
        } else {
            this._translate(this.$el,this.curPos,300);
            this._initPage(index)
        }
    }
    module.exports = easyswiper
})