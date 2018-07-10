# lulu ui

基于jQuery，针对PC网站，兼容IE7+（modern主题）或IE8+（peak主题）的前端UI框架。

下面这个形象照就是lulu ui的气质写照，更柔软，更亲近，同时简单单纯，对用户侧非常友好，因此，<strong>非常适合面向外部用户的网站开发</strong>。

<img src="http://qidian.gtimg.com/lulu/theme/modern/css/common/images/temp/figure.png" width="122" height="137">

## 上手简单

lulu整个项目就是提供一些UI组件的JS和CSS，很纯粹的JS和CSS，没有任何矫揉造作的“变身”处理。

因此，想要使用lulu ui，直接引入CSS和JS文件地址就可以使用了。HTML还是原来的HTML，CSS还是原来的CSS。什么Vue什么MV*什么高大上概念完全不需要掌握，参照文档，复制复制，粘贴粘贴，效果就出来了。

API文档参见：<a href="https://l-ui.com/content/about/design.html">LuLu UI API中文文档</a>

上面的地址走Github托管，如果访问速度比较慢，可以试试<a href="https://www.zhangxinxu.com/sp/lulu/mockup/content/about/use.php">这个文档地址</a>。

## 使用场景广泛

lulu ui既保留了jQuery插件即插即用的特性，也支持适合多人合作的模块化加载方式，因此适用场景更加广泛。

* 单人完成的某个简单运营活动页，需要个弹框提示功能，可以直接引入lulu ui中的Dialog.js，就可以使用了。
* 某网站看中了lulu ui某一个组件，例如日期选择功能，想拿过来使用，`<script>`引入日期选择JS，然后就可以使用了。
* 对于多人合作大型项目，可以使用类似seajs这样的加载器进行模块化加载与开发。

## 成熟

lulu ui诞生到现在已经有好几年了，跟那些年轻的UI框架不同，lulu ui可是见过很多世面的，谦逊内敛不聒噪，没必要大肆鼓吹，口碑说话。

开源是件严肃的事情，lulu ui一直认为，如果组件还没有达到不动如山的境地，那就应该继续埋头打磨。这么多年过去了，经过对内对外多个大中小型项目的验证与打磨，无论是交互细节还是代码本身细节，lulu ui现在都已经可以做到不显山露水了。

## 体验

lulu ui支持retina视网膜，同时支持aria无障碍访问，以及极少UI框架支持的keyboard键盘无障碍访问。坐下，坐下，都是基本操作而已。

借助扎实的前端基础知识，lulu ui有着很多创新的细节打磨，举个例子：如果用户是通过鼠标点击按钮打开的弹框，则弹框界面平平无奇；如果用户是通过ENTER回车键点击按钮打开的弹框，则弹框中的按钮默认会<code>outline</code>高亮！

<img src="https://qidian.qpic.cn/qidian_common/349573/851af9151027efc7e412e456f379263e/0" width="748" height="558">

## 快速了解lulu项目目录结构

所有资源都在<code>/theme/peak/</code>目录下，分sass, css和js 3个目录，如果你不想要sass，那这个文件夹就不用管。

图片资源在css目录下。

组件分ui和comp两个目录，前者是UI组件，后者是基于UI组件整合的前端解决方案。

更具体信息可以参见：<a href="https://l-ui.com/content/about/use.html">文档-使用与发布</a>

## 其他说明

因为IE7大势已去，目前modern主题已停止维护。
