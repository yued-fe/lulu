关于4个主题的介绍
=================

Edge 主题
----------------

Edge 主题是本意是边缘，因为所有的创新都发生在边缘。

采用原生 JavaScript 开发，完全不兼容 IE 浏览器的版本，兼容性如下表所示：

<table class="ui-table">
<tbody><tr>
    <td>IE <span style="color:red">✘</span></td>
    <td>Fire<wbr>fox 63+ <span style="color:green">✔</span></td>
    <td>Chrome 67+ <span style="color:green">✔</span></td>
    <td>Safari 10.1+（需polyfill） <span style="color:green">✔</span></td>
    <td>iOS Safari 10.3+（需polyfill） <span style="color:green">✔</span></td>
    <td>Andriod ?+ <span style="color:green">✔</span></td>
</tr>
</tbody></table>

ES6+ 语法，采用 Web Components 组件策略开发，单个组件支持直联，或者使用原生的 import 语法引用（需要设置 type="module" ），合集 JS 文件 all.js 只能直联引用。

如果项目需要兼容 Safari 浏览器，需要引用 <a href="https://github.com/yued-fe/lulu/blob/master/theme/edge/js/common/safari-polyfill.js">safari-polyfill.js</a>。

Edge 主题目前适合不需要考虑兼容性的中后台或者工具类 Web 产品，此主题会随着时代进步不断更新。

Pure 主题
---------------------

Pure 主题表示纯粹，是首个不依赖于任何框架与库的主题。

采用原生 JavaScript 开发，兼容 IE9 及其以上浏览器，是 LuLu UI 的主力与核心主题，适用于面向外部用户开发的 C 侧产品。

支持多种引用方式，可以在 Vue、React、Preact、Svelte 等框架中自如使用，当然，不同框架下的使用细节会有所差异，具体可以参见相关的<a href="https://www.zhangxinxu.com/sp/lulu/guide/edge/vue.html">教程</a>。

Peak 主题
---------------------

Peak 主体表示巅峰，是兼容陈旧 IE 浏览器的巅峰之作。

由于需要兼容 IE8 浏览器，因此依赖于 jQuery，以及由于 IE8 并不支持 SVG，因此，该主题使用的是 PNG 图标。

此主题经历过非常多大型项目的洗礼，是比较稳健的一个版本。

如果您的项目还需要兼容 IE8 浏览器，则这个主题会非常适合你。

由于历史原因，当时采用的是 Gulp 工作流，但很快就落后于时代，这个事情给了我许多反思，所以 Pure 主题和 Edge 主题就没有再引入任何这类流行工具。

因为 LuLu UI 如果想要做一个几十年长青的项目，一定要保持足够的独立自主，因为这些流行事物往往活个几年就走下坡路了。

Modern 主题
--------------------

Morden 表示现代，是 LuLu UI 最早的一款主题，诞生于 2015 年，那个时候还需要 兼容IE7 浏览器，之所以称为现代，就是虽然是一个还需要兼容陈旧 IE 浏览器的年代，但是却大胆的使用了非常多的 CSS3 新特性。

由于 IE7 浏览器已经扫入了历史的垃圾箱，因此，这个主题已经停止维护了，不建议使用。
