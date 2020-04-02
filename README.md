# LuLu UI

LuLu UI是阅文集团荣誉出品的前端UI组件库。

形象气质如下图，更柔软，更亲近，同时简单单纯，对用户侧非常友好，因此，<strong>LuLu UI非常适合面向外部用户的网站开发</strong>。

<img src="http://qidian.gtimg.com/lulu/theme/modern/css/common/images/temp/figure.png" width="122" height="137">

## 文档

* <a href="https://l-ui.com/">LuLu UI API中文文档</a>（GitHub托管，访问有延迟）
* <a href="https://www.zhangxinxu.com/sp/lulu/mockup/">LuLu UI API中文文档</a>（国内服务器托管，速度可以）

## 上手简单

LuLu整个项目就是提供一些UI组件的JS和CSS，很纯粹的JS和CSS，没有任何矫揉造作的“变身”处理。

因此，想要使用LuLu UI，直接引入CSS和JS文件地址就可以使用了。

HTML还是原来的HTML，CSS还是原来的CSS。

什么Vue什么MV\*什么高大上概念完全不需要掌握，参照文档，复制复制，粘贴粘贴，效果就出来了。

由于LuLu UI中的代码基础，结构简单，没有炫技成分，也没有复杂技巧，因此非常适合新人的学习。

## 使用场景广泛

LuLu UI既保留了传统插件即插即用的特性，也支持适合多人合作的模块化加载方式，因此适用场景更加广泛。

* 单人完成的某个简单运营活动页，需要个弹框提示功能，可以直接引入LuLu UI中的Dialog.js，就可以使用了。
* 某网站看中了LuLu UI某一个组件，例如日期选择功能，想拿过来使用，`<script>`引入日期选择JS，然后就可以使用了。
* 对于多人合作大型项目，可以使用类似seajs，require.js这样的加载器进行模块化加载与开发。
* 对于Vue或者React项目，想要使用某个组件，但又不希望引入一大堆东西，则LuLu UI非常合适，支持Vue/React单独引入。

## 成熟

LuLu UI诞生于2015年，非KPI项目，服务于真实业务场景，会一直不断迭代，不要担心遇到问题会无人问津。

开源是件严肃的事情，LuLu UI一直认为，如果组件还没有达到不动如山的境地，那就应该继续埋头打磨。这么多年过去了，LuLu UI经过阅文集团对内对外近20个大中小型项目的实践与打磨，无论是交互细节还是代码本身细节，LuLu UI现在都已经可以做到不显山露水了。

## 体验

LuLu UI支持Retina视网膜屏幕，同时支持Aria无障碍访问，以及极少UI框架支持的keyboard键盘无障碍访问。坐下，坐下，基操勿溜。

借助扎实的前端基础知识，LuLu UI有着很多创新的细节打磨，举个例子：如果用户是通过鼠标点击按钮打开的弹框，则弹框界面平平无奇；如果用户是通过ENTER回车键点击按钮打开的弹框，则弹框中的按钮默认会<code>outline</code>高亮！

<img src="https://qidian.qpic.cn/qidian_common/349573/851af9151027efc7e412e456f379263e/0" width="748" height="558">

## 快速了解项目目录结构

所有资源都在<code>/theme/</code>目录下，目前支持3个主题：

* modern主题。基于jQuery，兼容IE7+，针对PC网站。分sass, css和js 3个目录，如果你不想要sass，那这个文件夹就不用管。图片资源在css目录下。
* peak主题。基于jQuery，兼容IE8+，针对PC网站。分sass, css和js 3个目录，如果你不想要sass，那这个文件夹就不用管。图片资源在css目录下。
* pure主题。原生JavaScript编写，兼容IE9+，PC，Mobile网站通用。分css和js 2个目录，没有图片资源目录，所有图像CSS内联。

组件分ui和comp两个目录，前者是UI组件，后者是基于UI组件整合的前端解决方案。

更具体信息可以参见：<a href="https://l-ui.com/pure/about.use.html">文档-使用与发布</a>

## 项目成员

排名不分先后：nanaSun，ziven27，lennonover，wiia, popeyesailorman, 5ibinbin, littleLionGuoQing, peter006qi, HSDPA-wen, ShineaSYR, xiaoxiao78

## 其他说明

因为IE7大势已去，目前modern主题已停止维护。

组件均有测试，不过在内部项目中，没有对外。

<hr>

MIT License
