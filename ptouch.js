/* 
* @Author: 12050231
* @Date:   2013-11-10 08:49:50
* @Last Modified by :   12050231
* @Last Modified time: 2013-11-22 17:42:00
*/

;(function(win,undefined) {
    var P = {},
        _nodeList_ = NodeList.prototype,
        _htmlElement_ = HTMLElement.prototype;
    function isObject(obj){return Object.prototype.toString.call(obj) === '[object Object]'}
    function isFunction(value) { return type(value) == "function" }
    function __setProto__(obj){
        if(isObject(obj)){
            obj = Object.create(obj);
            return obj;
        }
    }
    P.VERSION = "0.2";
    P.author = "PPanda";
    // 通用操作方法
    P.Uitl = {
        aniFrame: function(){
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
        },
        tween: {
            easeOutQuad: function (t) {
                return -1 *t*(t-2);
            }
        }
    };
    // 公用交互方法
    P.Base = {
        EVA: function(o, r) {
            var p = "";
            for(p in r){
                o[p] = r[p]
            }
            return o;
        }

    };
    // dom相关
    P.D = {
        
    };
    P.D.fn = {
        show: function(){
            return this.each(function(i,_this){
                _this.style.display = "none";
            });
        },
        hide: function(){
            return this.each(function(i,_this){
                _this.style.display = "block";
            });
        },
        bind: function(type, Fn){
            return this.each(function(i, _this){
                _this.addEventListener(type, Fn, false)
            })
        },
        find: function(context){
            if(typeof context === "string"){
                return this.querySelectorAll(context);
            }
            this.each(function(i, _this){
                var t = _this.querySelectorAll(context);
                return t;
            });
        },
        css: function(p){
            if(typeof p === "string"){
                return  win.getComputedStyle ? getComputedStyle(this, false)[p] : this.currentStyle[p];
            }
            return this.each(function(i,_this){
                var _tmp = ';';
                for(i in p){
                    if(p.hasOwnProperty(i)){
                        _tmp += i + ":" + p[i] + ";";
                    }
                }
                _this.style.cssText +=  _tmp;
            });
        },
        touch: function(type, opt, Fn){
            return this.each(function(i, _this){
                P.UI.touch.init.call(P.UI.touch,_this,type,opt,Fn);
            });
        },
        // animate({height:100},1000)
        animate: function(config,time,callback){
            return this.each(function(i,_this){
                var _def = {
                    animationTime: time || 1000,
                    tweenEasing: 'easeOutQuad',
                    animateDone:callback
                }
                P.Base.EVA(_def, config);
                var animFrame = parseFloat(10/_def.animationTime),
                    easingFunction = P.Uitl.tween[_def.tweenEasing],
                    percentAnimComplete = 0;
                var _prop = {};
                P.Uitl.aniFrame()(animLoop);
                for(k in config){
                    _prop[k] = parseInt(_this.css(k));
                }
                // 动画帧
                function animateFrame(){
                    // tween参数
                    var adjustEase = easingFunction(percentAnimComplete);
                    // console.log(adjustEase)
                    for(p in config){
                        var _p = {}
                        _p[p] = _prop[p] - (_prop[p] - config[p])*adjustEase + "px";
                        _this.css(_p);
                    }          
                }
                // 动画循环
                function animLoop(){
                    percentAnimComplete += animFrame;
                    animateFrame(); 
                    if (percentAnimComplete <= 1){
                        P.Uitl.aniFrame()(animLoop);
                    }
                    else{
                        if (typeof _def.animateDone == "function") _def.animateDone();
                    }
                }
            });
        }
    }
    P.D.domEl = function(HE,NODE){
        for(var i in P.D.fn){
            if(P.D.fn.hasOwnProperty(i)){
                HE[i] = P.D.fn[i];
                NODE[i] = P.D.fn[i];
            }
        }
        NODE.each = function(callback){
            for(var i = 0,l = this.length; i < l; i++){
                callback.call(this[i],i,this[i]);
            }
            return this;
        }
        HE.each = function(callback){
            callback.call(this,0,this);
            return this;
        }
    }(_htmlElement_,_nodeList_);
    // 一些ui交互效果
    P.UI = {};
    P.UI.touch = {
        init: function(el, type, opt, Fn){
            this.bindEl = el;
            this.pos = [];
            this.Fn = Fn || function(){};
            this.opt = opt || {};
            //执行绑定方法
            this[type](Fn);
        },
        Carousel: function(opt){
            var _el = this.bindEl;
            var that = this;
            var _opt = {
                direction : "both",
                innerTag: "div",
                idx:0,
                isMove: true,
                hasNav: true,
                hasCtrl: false,
                isAuto:false
            }
            _opt.elWidth = parseInt(_el.querySelectorAll(_opt.innerTag)[0].css("width"),10);
            _opt.len = _el.querySelectorAll(_opt.innerTag).length;
            P.Base.EVA(_opt,this.opt);
            this.opt = _opt;
            this.touchEvent(_opt);
            // hasNav
            _opt.hasNav && this.drawNavCount(_el,_opt);
            // hasCtrl
            _opt.hasCtrl && this.isTrigger(_el,_opt);
            // isAuto
            _opt.isAuto && this.autoAnimate(_el,_opt);
            // like proxy
            _el.addEventListener("webkitTransitionEnd",function(){that.isAnimate(that)}, false);
            that.setCSS(_el,_opt)
        },
        setCSS: function(_el,opt){
            var innerEl = _el.querySelectorAll(opt.innerTag);
            var _width = 0;
            for(var i = 0; i<innerEl.length; i++){
                var innerWidth = innerEl[i].css("width");
                innerEl[i].css({"width":innerWidth});
                _width += parseInt(innerWidth);
            }
            _el.css({"width":_width + "px"});
        },
        setPara: function(pos){
            this.pos = pos;
        },
        swipeleft: function(opt, Fn){
            var _el = this.bindEl;
            var that = this;
            var _opt = {
                direction : "left",
                moveDistance: _el.offsetWidth,
                idx: 0,
                elWidth: 1
            }
            P.Base.EVA(_opt,this.opt);
            this.touchEvent(_opt)

        },
        swiperight: function(opt, Fn){
            var _el = this.bindEl;
            var that = this;
            var _opt = {
                direction : "right",
                moveDistance: _el.offsetWidth,
                idx: 0,
                elWidth: 1
            }
            P.Base.EVA(_opt,this.opt);
            this.touchEvent(_opt)

        },
        touchEvent: function(_opt){
            this.touchstart(_opt);
            this.touchmove(_opt);
            this.touchend(_opt);

        },
        // 事件
        touchstart: function(opt){
            var that = this,
                _el = this.bindEl;
            _el.bind("touchstart", function(e){
                var _touches = e.changedTouches;
                that.pos.startX = _touches[0].pageX + opt.idx*opt.elWidth;
                that.pos.startY = _touches[0].pageY + opt.idx*opt.elWidth;
                that.pos.originalX = _touches[0].pageX;
                that.pos.originalY = _touches[0].pageY;
                that.setPara(that.pos);
                console.log("start")
                opt.isAuto && clearInterval(that.opt.auto);
            })
        },
        touchmove: function(opt){
            var that = this,
                _el = this.bindEl;
            _el.bind("touchmove", function(e){
                _el.style.webkitTransition = "none";
                e.preventDefault();
                // 目测重影问题
                _el.parentNode.css({"background-image":"none"});
                var _touches = e.changedTouches;
                that.pos.moveX = _touches[0].pageX;
                that.pos.moveY = _touches[0].pageY;
                that.setPara(that.pos);
                if(opt.direction === "left" && (that.pos.moveX - that.pos.startX) < 0){
                    that.transform(this,that.pos.moveX - that.pos.startX);
                }else if(opt.direction === "right" && (that.pos.moveX - that.pos.startX) > 0){
                    that.transform(this,that.pos.moveX - that.pos.startX);
                }else if(opt.direction === "both"){
                    that.transform(this,that.pos.moveX - that.pos.startX);
                }
            });

        },
        touchend: function(opt){
            var that = this,
                _el = this.bindEl;
            _el.bind("touchend", function(e){
                _el.style.webkitTransition = '-webkit-transform 0.8s ease';
                _el.style["-webkit-backface-visibility"] = 'hidden';
                var _direction = that.pos.moveX - that.pos.originalX;
                var _moveDistance = Math.abs(that.pos.moveX - that.pos.originalX);
                var _endDistance = parseInt(opt.elWidth)/5;
                that.opt.isMove = true;
                if(_direction < 0){
                    that.moveNext(this,opt,_moveDistance,_endDistance);
                }

                if(_direction > 0){
                    that.movePrev(this,opt,_moveDistance,_endDistance);
                }
                
                if(opt.isAuto){
                    that.autoAnimate(_el,opt);
                }
                if(opt.moveDistance && Math.abs(that.pos.moveX - that.pos.originalX) > opt.moveDistance/2){
                    that.transform(this,-opt.moveDistance);
                    _el.addEventListener("webkitTransitionEnd",function(){
                        _el.style.display = "none";
                    }, false);
                }
            });
        },
        autoAnimate: function(_this, opt){
            var that = this;
            this.opt.auto = null;
            clearInterval(that.opt.auto);
            _this.style.webkitTransition = '-webkit-transform 0.8s ease';
            this.opt.auto = setInterval(function(){
                if(opt.idx == opt.len - 1){
                    opt.idx = 0;
                    that.moveNext(_this,opt,1,1);
                }else{
                    that.moveNext(_this,opt,1,0);
                }
                console.log("auto")
            },2000);

        },
        isAnimate: function(_this){
            _this.opt.isMove = true;
        },
        movePrev: function(_this,opt,distance,endDistance){
            var that = this;
            if(!that.opt.isMove){return;}
            if(distance > endDistance){
                if(opt.idx <= 0){
                    opt.idx = 0;
                }else{
                    opt.idx--;
                }
                that.transform(_this,-parseInt(opt.elWidth)*opt.idx);
            }else{
                that.transform(_this,-parseInt(opt.elWidth)*opt.idx);
            }
        },
        moveNext: function(_this,opt,distance,endDistance){
            var that = this;
            if(!that.opt.isMove){return;}
            if(distance > endDistance){
                if(opt.idx >= opt.len-1){
                    opt.idx = opt.len-1;
                }else{
                    opt.idx++;
                }
                that.transform(_this,-parseInt(opt.elWidth)*opt.idx);
            }else{
                that.transform(_this,-parseInt(opt.elWidth)*opt.idx);
            }
        },
        // hasNav
        drawNavCount: function(_this,opt){
            var that = this,
                navHTML = '';
            var cur = opt.idx !== 0 ? opt.idx : opt.idx || 0;
            var navInnerHTML = '',cls = "cur";
            for(var i = 1; i<opt.len+1; i++){
                if(i == cur){
                    navInnerHTML += "<span class='cur'>" + i + "</span>";
                }else{
                    navInnerHTML += "<span>" + i + "</span>";
                }
            }
            navHTML = '<div id="CarouselNav" class="carousel_nav">' + navInnerHTML + '</div>';
            !document.querySelector("#CarouselNav") && _this.insertAdjacentHTML("afterEnd",navHTML);
            var _span = document.querySelector("#CarouselNav").querySelectorAll("span");
            _span.each(function(i,el){
                el.className = "";
                _span[opt.idx].className = "cur";
            });
        },
        // isTrigger
        isTrigger: function(_this, opt){
            var that = this,
                ctrlHTML = '<div id="CarouselCtrl" class="carousel_ctrl"><span class="carousel_prev">prev</span><span class="carousel_next">next</span></div>';
            !document.querySelector("#CarouselCtrl") && _this.insertAdjacentHTML("afterEnd",ctrlHTML);
            var _prev = document.querySelector("#CarouselCtrl").find(".carousel_prev")[0],
                _next = document.querySelector("#CarouselCtrl").find(".carousel_next")[0];
            _this.style.webkitTransition = '-webkit-transform 0.8s ease';
            _prev.bind("click", function(){
                that.movePrev(_this,opt,1,0);
            });
            _next.bind("click", function(){
                that.moveNext(_this,opt,1,0);
            });
        },
        // animate
        transform: function(el,translateX){
            this.opt.isMove = false;
            if(this.opt.idx == this.opt.len-1 || this.opt.idx == 0){this.opt.isMove = true}
            if(this.opt.hasNav){
                this.drawNavCount(el,this.opt);
            }
            el.style.webkitTransform = "translate3d(" + translateX + "px, 0, 0)";//translateX;
        }
    }
    
    P.UI = __setProto__(P.UI);
    // 调用
    P.Use = function(require, options) {
        // var _require = require.split('.');
        P.UI[require](options);
    }
    
    win.PTouch = __setProto__(P);
    console.log(PTouch);
})(window);
;(function(){
    PTouch.UI.pullRefresh = function(opt){
        console.log(this);
        this.Refresh = function(){
            return new Refresh();
        }
        function Refresh(){
            console.log(this,1)
        }
        Refresh.prototype.init = function(){

        };

        return this.Refresh();

    };
})();

PTouch.Use("pullRefresh", {

})
document.querySelector("#box").touch("Carousel");



// document.addEventListener("touchstart",function(){}, true)