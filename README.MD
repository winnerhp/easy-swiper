### install

```
npm install easy-swiper
```

### how to use

``` html
<style>
#container {
    position: relative;
    height: 100px;
}
.item {
    z-index: 9;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
}
.item.active {
    position: relative
}
</style>

<div id="container">
    <div class="item"></div>
    <div class="item"></div>
    <div class="item"></div>
</div>

<script type="text/javascript" src="./easySwiper.min.js"></script>

//(if support) var easySwiper = require('easy-swiper'); 
 
var container = new easySwiper({
    element: document.querySelector('#container'),
    initNum: 0,
    onChangeBegin: function(obj){
    },
    onChangeEnd: function(obj){
    },
    onInit: function(obj){
    },
    autoPlay: true||false
})
 
container.gotoPage(num)
```
 
### params说明
 
* element: swiper容器(必须)
* initNum: 初始化加载num（从0开始）
* onChangeBegin: swiper开始
* onChangeEnd: swiper结束
* onInit: swiper初始化完成
* autoPlay: 是否轮播
* 回调函数的obj包含obj.dom和obj.num,分别代表当前dom和当前索引值
* container.gotoPage(num) 从0开始的索引，(!注autoPlay为true的时候gotoPage不生效)
* 插件会对当前swiper-item添加class="active",方便定位

 
