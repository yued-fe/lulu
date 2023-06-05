/**
 * @description LuLu UI文档交互JS
 * @author zhangxinxu(.com)
 * @create 2019-07-17
 * @version 1.0
 */
(function () {
    // 返回顶部
    var eleBacktop = document.querySelector('#backtop');
    // 快速跳转
    var eleH3s = document.querySelectorAll('article h3');
    // 主题下拉选择
    var eleSelectTheme = document.querySelector('#selectTheme');

    var funScroll = function () {
        var st = document.documentElement.scrollTop || document.body.scrollTop;
        if (st > 0) {
            eleBacktop.style.display = 'block';
        } else {
            eleBacktop.style.display = 'none';
        }

        var indexNav = 0;

        var arrTop = [].slice.call(eleH3s).map(function (h3) {
            return h3.getBoundingClientRect().top;
        });

        // 容器内部高度
        var scrollHeight = document.body.scrollHeight;
        var windowHeight = window.innerHeight;
        // 滚动到底部，一定是最后一个
        if (window.innerHeight + st >= scrollHeight - 1) {
            indexNav = eleH3s.length - 1;
        } else if (st == 0) {
            indexNav = 0;
        } else {
            var loop = true;
            arrTop.forEach(function (top, index) {
                if (loop == false) {
                    return;
                }
                if (index == arrTop.length - 1) {
                    indexNav = arrTop.length - 1;
                } else if (top > 0) {
                    if (top < windowHeight) {
                        indexNav = index;
                    } else {
                        indexNav = index > 0 ? index - 1 : 0;
                    }

                    loop = false;
                }
            });
        }

        // 获取目前需要高亮的导航元素
        var eleNavAll = document.querySelectorAll('#sectionNav a');
        var eleTargetNav = eleNavAll[indexNav];
        if (eleTargetNav && eleTargetNav.classList.contains('active') == false) {
            eleNavAll.forEach(function (nav) {
                nav.classList.remove('active');
            });
            eleTargetNav.classList.add('active');
        }
    };


    var htmlNav = '<div class="tr">&nbsp;<span id="sectionNav" class="section_nav">';
    [].slice.call(eleH3s).forEach(function (h3) {
        var id = h3.id || 'id' + String(Math.random()).replace('0.', '');
        h3.id = id;
        // 创建定位元素
        htmlNav = htmlNav + '<a href="#' + id + '">' + h3.innerHTML + '</a>';
    });
    htmlNav += '</span></div>';

    var eleArticle = document.querySelector('article');
    if (eleArticle) {
        eleArticle.insertAdjacentHTML('beforeend', htmlNav);
        document.getElementById('sectionNav').addEventListener('click', function (event) {
            var target = event.target;
            if (target && target.tagName == 'A') {
                event.preventDefault();

                var selector = target.getAttribute('href');
                var eleH3 = document.querySelector(selector);

                if (eleH3) {
                    // window.pageYOffset = eleH3;
                    eleH3.scrollIntoView();
                    funScroll();
                }
            }
        });
    }

    // 滚动与返回顶部元素的显隐控制
    window.addEventListener('scroll', funScroll);
    window.addEventListener('resize', funScroll);

    eleBacktop.addEventListener('click', function (event) {
        event.preventDefault();
        document.documentElement.scrollTop = document.body.scrollTop = 0;
    });

    funScroll();

    var eleContributorsP = document.querySelector('#contributorsP');
    if (eleContributorsP) {
        eleContributorsP.innerHTML = eleContributorsP.innerText.split(/(?:,|，|、)\s*/g).map(function (username) {
            return '<a href="https://github.com/' + username + '" target="_blank" rel="nofollow noopener">' + username + '</a>';
        }).join('，');
    }


    // 本地favicon设置
    if (location.hostname == 'localhost' || location.hostname == '127.0.0.1') {
        document.head.insertAdjacentHTML('beforeend', '<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAC1QTFRF9GFc////95WS+ba0/Nzb+Kup9X15/u7u/eXl9W9r9omG+8nI/vf2+9PS+KCeoqOPVQAAAHRJREFUeNrskksOgCAMRBnaQvl5/+MqiEB05VrfphPyQhMGY34unK24JYdzxi4Ie3iWnjOUo7FJUWTcQaCRGbZNi2XJtwSpL1O6TP4pKLes7cynhxBQhZCRji5K3zS7YNYmmJhRkXubs76wEZH7f/k7dgEGAEjAApA1ZR1qAAAAAElFTkSuQmCC" sizes="32x32">');
    }

    // pre移动端4空格变2个
    if (screen.width < 640) {
        document.querySelectorAll('article pre').forEach(function (elePre) {
            elePre.innerHTML = elePre.innerHTML.replace(/ {4}/g, '  ');
        });
    }

    document.querySelectorAll('article pre[scrollable]').forEach(function (elePre) {
        elePre.addEventListener('click', function () {
            var section = window.getSelection();
            if (section && section.baseNode && section.baseNode.parentElement == this && section.type == 'Range') {
                return;
            }
            this.toggleAttribute('open');
        });
    });

    // 主题下拉选择
    eleSelectTheme.addEventListener('change', function () {
        // 切换主题
        var pathname = location.pathname;
        var urlPure = '';
        if (pathname.indexOf('/' + this.value + '/') !== -1) {
            location.reload();
        } else if (this.value == 'peak') {
            // 老文档
            // 文件后缀
            var suffix = '.php';
            if (/l-ui/.test(location.host)) {
                suffix = '.html';
            }
            urlPure = pathname.split('.html')[0].replace(/\/(?:pure|edge)\//, '/content/').replace('.', '/') + suffix;
            location.replace(urlPure);
        } else {
            urlPure = pathname.replace(/\/(?:pure|edge)\//, '/' + this.value + '/');
            location.replace(urlPure);
        }
    });

    // progress组件peak版本没有，故删除
    if (location.pathname.indexOf('progress.html') != -1) {
        document.querySelector('#selectTheme option[value="peak"]').remove();
    }

    // 插入svg sprite图标
    document.body.insertAdjacentHTML('afterbegin', '<div hidden><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">\
  <defs><symbol viewBox="0 0 1759 1280" id="icon-maxcdn"><path d="M1745 517l-164 763h-334l178-832q13-56-15-88-27-33-83-33h-169l-204 953H620l204-953H538l-204 953H0l204-953L51 0h1276q101 0 189.5 40.5T1664 154q60 73 81 168.5t0 194.5z"/></symbol>\
    <symbol viewBox="0 0 1641 1643" id="icon-wrench"><path d="M363 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm644-420l-682 682q-37 37-90 37-52 0-91-37L38 1498q-38-36-38-90 0-53 38-91l681-681q39 98 114.5 173.5T1007 924zm634-435q0 39-23 106-47 134-164.5 217.5T1195 896q-185 0-316.5-131.5T747 448t131.5-316.5T1195 0q58 0 121.5 16.5T1424 63q16 11 16 28t-16 28l-293 169v224l193 107q5-3 79-48.5t135.5-81T1609 454q15 0 23.5 10t8.5 25z"/></symbol>\
  <symbol viewBox="0 0 1536 1536" id="icon-delicious"><path d="M1472 1248V768H768V64H288q-93 0-158.5 65.5T64 288v480h704v704h480q93 0 158.5-65.5T1472 1248zm64-960v960q0 119-84.5 203.5T1248 1536H288q-119 0-203.5-84.5T0 1248V288Q0 169 84.5 84.5T288 0h960q119 0 203.5 84.5T1536 288z"/></symbol>\
 <symbol viewBox="0 0 1536 1536" id="icon-caret-square-o-right"><path d="M1088 768q0 33-27 52l-448 320q-31 23-66 5-35-17-35-57V448q0-40 35-57 35-18 66 5l448 320q27 19 27 52zm192 480V288q0-14-9-23t-23-9H288q-14 0-23 9t-9 23v960q0 14 9 23t23 9h960q14 0 23-9t9-23zm256-960v960q0 119-84.5 203.5T1248 1536H288q-119 0-203.5-84.5T0 1248V288Q0 169 84.5 84.5T288 0h960q119 0 203.5 84.5T1536 288z"/></symbol>\
   <symbol viewBox="0 0 1792 1408" id="icon-tasks"><path d="M1024 1280h640v-128h-640v128zM640 768h1024V640H640v128zm640-512h384V128h-384v128zm512 832v256q0 26-19 45t-45 19H64q-26 0-45-19t-19-45v-256q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-512v256q0 26-19 45t-45 19H64q-26 0-45-19T0 832V576q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-512v256q0 26-19 45t-45 19H64q-26 0-45-19T0 320V64q0-26 19-45T64 0h1664q26 0 45 19t19 45z"/></symbol>\
   <symbol viewBox="0 0 1792 1408" id="icon-server"><path d="M128 1280h1024v-128H128v128zm0-512h1024V640H128v128zm1568 448q0-40-28-68t-68-28-68 28-28 68 28 68 68 28 68-28 28-68zM128 256h1024V128H128v128zm1568 448q0-40-28-68t-68-28-68 28-28 68 28 68 68 28 68-28 28-68zm0-512q0-40-28-68t-68-28-68 28-28 68 28 68 68 28 68-28 28-68zm96 832v384H0v-384h1792zm0-512v384H0V512h1792zm0-512v384H0V0h1792z"/></symbol>\
  <symbol viewBox="0 0 1408 1408" id="icon-square-o"><path d="M1120 128H288q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113V288q0-66-47-113t-113-47zm288 160v832q0 119-84.5 203.5T1120 1408H288q-119 0-203.5-84.5T0 1120V288Q0 169 84.5 84.5T288 0h832q119 0 203.5 84.5T1408 288z"/></symbol>\
  <symbol viewBox="0 0 1664 1408" id="icon-table"><path d="M512 1248v-192q0-14-9-23t-23-9H160q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384V672q0-14-9-23t-23-9H160q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9H672q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zM512 480V288q0-14-9-23t-23-9H160q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384V672q0-14-9-23t-23-9H672q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm-512-768V288q0-14-9-23t-23-9H672q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384V672q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384V288q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm128-320v1088q0 66-47 113t-113 47H160q-66 0-113-47T0 1248V160Q0 94 47 47T160 0h1344q66 0 113 47t47 113z"/></symbol>\
  <symbol viewBox="0 0 1664 1728" id="icon-spinner"><path d="M462 1394q0 53-37.5 90.5T334 1522q-52 0-90-38t-38-90q0-53 37.5-90.5T334 1266t90.5 37.5T462 1394zm498 206q0 53-37.5 90.5T832 1728t-90.5-37.5T704 1600t37.5-90.5T832 1472t90.5 37.5T960 1600zM256 896q0 53-37.5 90.5T128 1024t-90.5-37.5T0 896t37.5-90.5T128 768t90.5 37.5T256 896zm1202 498q0 52-38 90t-90 38q-53 0-90.5-37.5T1202 1394t37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zM494 398q0 66-47 113t-113 47-113-47-47-113 47-113 113-47 113 47 47 113zm1170 498q0 53-37.5 90.5T1536 1024t-90.5-37.5T1408 896t37.5-90.5T1536 768t90.5 37.5T1664 896zm-640-704q0 80-56 136t-136 56-136-56-56-136 56-136T832 0t136 56 56 136zm530 206q0 93-66 158.5T1330 622q-93 0-158.5-65.5T1106 398q0-92 65.5-158t158.5-66q92 0 158 66t66 158z"/></symbol>\
  <symbol viewBox="0 0 1792 1792" id="icon-product-hunt"><path d="M1150 762q0 56-39.5 95t-95.5 39H762V627h253q56 0 95.5 39.5T1150 762zm179 0q0-130-91.5-222T1015 448H582v896h180v-269h253q130 0 222-91.5t92-221.5zm463 134q0 182-71 348t-191 286-286 191-348 71-348-71-286-191-191-286T0 896t71-348 191-286T548 71 896 0t348 71 286 191 191 286 71 348z"/></symbol>\
  <symbol viewBox="0 0 1536 1536" id="icon-check-square"><path d="M685 1171l614-614q19-19 19-45t-19-45l-102-102q-19-19-45-19t-45 19L640 832 429 621q-19-19-45-19t-45 19L237 723q-19 19-19 45t19 45l358 358q19 19 45 19t45-19zm851-883v960q0 119-84.5 203.5T1248 1536H288q-119 0-203.5-84.5T0 1248V288Q0 169 84.5 84.5T288 0h960q119 0 203.5 84.5T1536 288z"/></symbol>\
  <symbol viewBox="0 0 2048 1280" id="icon-toggle-on"><path d="M0 640q0-130 51-248.5t136.5-204T391.5 51 640 0h768q130 0 248.5 51t204 136.5 136.5 204 51 248.5-51 248.5-136.5 204-204 136.5-248.5 51H640q-130 0-248.5-51t-204-136.5T51 888.5 0 640zm1408 512q104 0 198.5-40.5T1770 1002t109.5-163.5T1920 640t-40.5-198.5T1770 278t-163.5-109.5T1408 128t-198.5 40.5T1046 278 936.5 441.5 896 640t40.5 198.5T1046 1002t163.5 109.5T1408 1152z"/></symbol>\
  <symbol viewBox="0 0 1792 1408" id="icon-list"><path d="M256 1184v192q0 13-9.5 22.5T224 1408H32q-13 0-22.5-9.5T0 1376v-192q0-13 9.5-22.5T32 1152h192q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5T224 1024H32q-13 0-22.5-9.5T0 992V800q0-13 9.5-22.5T32 768h192q13 0 22.5 9.5T256 800zm0-384v192q0 13-9.5 22.5T224 640H32q-13 0-22.5-9.5T0 608V416q0-13 9.5-22.5T32 384h192q13 0 22.5 9.5T256 416zm1536 768v192q0 13-9.5 22.5t-22.5 9.5H416q-13 0-22.5-9.5T384 1376v-192q0-13 9.5-22.5t22.5-9.5h1344q13 0 22.5 9.5t9.5 22.5zM256 32v192q0 13-9.5 22.5T224 256H32q-13 0-22.5-9.5T0 224V32Q0 19 9.5 9.5T32 0h192q13 0 22.5 9.5T256 32zm1536 768v192q0 13-9.5 22.5t-22.5 9.5H416q-13 0-22.5-9.5T384 992V800q0-13 9.5-22.5T416 768h1344q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5T1760 640H416q-13 0-22.5-9.5T384 608V416q0-13 9.5-22.5T416 384h1344q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5T1760 256H416q-13 0-22.5-9.5T384 224V32q0-13 9.5-22.5T416 0h1344q13 0 22.5 9.5T1792 32z"/></symbol>\
  <symbol viewBox="0 0 1536 1280" id="icon-bars"><path d="M1536 1088v128q0 26-19 45t-45 19H64q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19H64q-26 0-45-19T0 704V576q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19H64q-26 0-45-19T0 192V64q0-26 19-45T64 0h1408q26 0 45 19t19 45z"/></symbol>\
  <symbol viewBox="0 0 1536 1408" id="icon-sliders"><path d="M352 1152v128H0v-128h352zm352-128q26 0 45 19t19 45v256q0 26-19 45t-45 19H448q-26 0-45-19t-19-45v-256q0-26 19-45t45-19h256zm160-384v128H0V640h864zM224 128v128H0V128h224zm1312 1024v128H800v-128h736zM576 0q26 0 45 19t19 45v256q0 26-19 45t-45 19H320q-26 0-45-19t-19-45V64q0-26 19-45t45-19h256zm640 512q26 0 45 19t19 45v256q0 26-19 45t-45 19H960q-26 0-45-19t-19-45V576q0-26 19-45t45-19h256zm320 128v128h-224V640h224zm0-512v128H672V128h864z"/></symbol>\
  <symbol viewBox="0 0 1792 1792" id="icon-eyedropper"><path d="M1698 94q94 94 94 226.5T1698 546l-225 223 104 104q10 10 10 23t-10 23l-210 210q-10 10-23 10t-23-10l-105-105-603 603q-37 37-90 37H320L64 1792l-64-64 128-256v-203q0-53 37-90l603-603-105-105q-10-10-10-23t10-23l210-210q10-10 23-10t23 10l104 104 223-225q93-94 225.5-94T1698 94zM512 1472l576-576-192-192-576 576v192h192z"/></symbol>\
  <symbol viewBox="0 0 1792 1536" id="icon-external-link"><path d="M1408 928v320q0 119-84.5 203.5T1120 1536H288q-119 0-203.5-84.5T0 1248V416q0-119 84.5-203.5T288 128h704q14 0 23 9t9 23v64q0 14-9 23t-23 9H288q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113V928q0-14 9-23t23-9h64q14 0 23 9t9 23zm384-864v512q0 26-19 45t-45 19-45-19l-176-176-652 652q-10 10-23 10t-23-10L695 983q-10-10-10-23t10-23l652-652-176-176q-19-19-19-45t19-45 45-19h512q26 0 45 19t19 45z"/></symbol>\
  <symbol viewBox="0 0 1664 1792" id="icon-bell"><path d="M848 1696q0-16-16-16-59 0-101.5-42.5T688 1536q0-16-16-16t-16 16q0 73 51.5 124.5T832 1712q16 0 16-16zm816-288q0 52-38 90t-90 38h-448q0 106-75 181t-181 75-181-75-75-181H128q-52 0-90-38t-38-90q50-42 91-88t85-119.5 74.5-158.5 50-206T320 576q0-152 117-282.5T744 135q-8-19-8-39 0-40 28-68t68-28 68 28 28 68q0 20-8 39 190 28 307 158.5T1344 576q0 139 19.5 260t50 206 74.5 158.5 85 119.5 91 88z"/></symbol>\
  <symbol viewBox="0 0 901.6666870117188 1664" id="icon-bolt"><path d="M887.333 438q18 20 7 44l-540 1157q-13 25-42 25-4 0-14-2-17-5-25.5-19t-4.5-30l197-808-406 101q-4 1-12 1-18 0-31-11-18-15-13-39l201-825q4-14 16-23t28-9h328q19 0 32 12.5t13 29.5q0 8-5 18l-171 463 396-98q8-2 12-2 19 0 34 15z"/></symbol>\
  <symbol viewBox="0 0 1408 384" id="icon-ellipsis-h"><path d="M384 96v192q0 40-28 68t-68 28H96q-40 0-68-28T0 288V96q0-40 28-68T96 0h192q40 0 68 28t28 68zm512 0v192q0 40-28 68t-68 28H608q-40 0-68-28t-28-68V96q0-40 28-68t68-28h192q40 0 68 28t28 68zm512 0v192q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68V96q0-40 28-68t68-28h192q40 0 68 28t28 68z"/></symbol>\
  <symbol viewBox="0 0 1664 1546" id="icon-dropbox"><path d="M338 589l494 305-342 285L0 860zm986 555v108l-490 293v1l-1-1-1 1v-1l-489-293v-108l147 96 342-284v-2l1 1 1-1v2l343 284zM490 0l342 285-494 304L0 319zm836 589l338 271-489 319-343-285zM1175 0l489 319-338 270-494-304z"/></symbol>\
  <symbol viewBox="0 0 1663 1408" id="icon-check-square-o"><path d="M1408 802v318q0 119-84.5 203.5T1120 1408H288q-119 0-203.5-84.5T0 1120V288Q0 169 84.5 84.5T288 0h832q63 0 117 25 15 7 18 23 3 17-9 29l-49 49q-10 10-23 10-3 0-9-2-23-6-45-6H288q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113V866q0-13 9-22l64-64q10-10 23-10 6 0 12 3 20 8 20 29zm231-489l-814 814q-24 24-57 24t-57-24L281 697q-24-24-24-57t24-57l110-110q24-24 57-24t57 24l263 263 647-647q24-24 57-24t57 24l110 110q24 24 24 57t-24 57z"/></symbol>\
  <symbol viewBox="0 0 1664 1792" id="icon-calendar"><path d="M128 1664h288v-288H128v288zm352 0h320v-288H480v288zm-352-352h288V992H128v320zm352 0h320V992H480v320zM128 928h288V640H128v288zm736 736h320v-288H864v288zM480 928h320V640H480v288zm768 736h288v-288h-288v288zm-384-352h320V992H864v320zM512 448V160q0-13-9.5-22.5T480 128h-64q-13 0-22.5 9.5T384 160v288q0 13 9.5 22.5T416 480h64q13 0 22.5-9.5T512 448zm736 864h288V992h-288v320zM864 928h320V640H864v288zm384 0h288V640h-288v288zm32-480V160q0-13-9.5-22.5T1248 128h-64q-13 0-22.5 9.5T1152 160v288q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5zm384-64v1280q0 52-38 90t-90 38H128q-52 0-90-38t-38-90V384q0-52 38-90t90-38h128v-96q0-66 47-113T416 0h64q66 0 113 47t47 113v96h384v-96q0-66 47-113t113-47h64q66 0 113 47t47 113v96h128q52 0 90 38t38 90z"/></symbol>\
  <symbol viewBox="0 0 1899 1515" id="icon-tags"><path d="M448 320q0-53-37.5-90.5T320 192t-90.5 37.5T192 320t37.5 90.5T320 448t90.5-37.5T448 320zm1067 576q0 53-37 90l-491 492q-39 37-91 37-53 0-90-37L91 762q-38-37-64.5-101T0 544V128q0-52 38-90t90-38h416q53 0 117 26.5T763 91l715 714q37 39 37 91zm384 0q0 53-37 90l-491 492q-39 37-91 37-36 0-59-14t-53-45l470-470q37-37 37-90 0-52-37-91L923 91q-38-38-102-64.5T704 0h224q53 0 117 26.5T1147 91l715 714q37 39 37 91z"/></symbol>\
  <symbol viewBox="0 0 1792 1408" id="icon-list-alt"><path d="M384 1056v64q0 13-9.5 22.5T352 1152h-64q-13 0-22.5-9.5T256 1120v-64q0-13 9.5-22.5t22.5-9.5h64q13 0 22.5 9.5t9.5 22.5zm0-256v64q0 13-9.5 22.5T352 896h-64q-13 0-22.5-9.5T256 864v-64q0-13 9.5-22.5T288 768h64q13 0 22.5 9.5T384 800zm0-256v64q0 13-9.5 22.5T352 640h-64q-13 0-22.5-9.5T256 608v-64q0-13 9.5-22.5T288 512h64q13 0 22.5 9.5T384 544zm1152 512v64q0 13-9.5 22.5t-22.5 9.5H544q-13 0-22.5-9.5T512 1120v-64q0-13 9.5-22.5t22.5-9.5h960q13 0 22.5 9.5t9.5 22.5zm0-256v64q0 13-9.5 22.5T1504 896H544q-13 0-22.5-9.5T512 864v-64q0-13 9.5-22.5T544 768h960q13 0 22.5 9.5t9.5 22.5zm0-256v64q0 13-9.5 22.5T1504 640H544q-13 0-22.5-9.5T512 608v-64q0-13 9.5-22.5T544 512h960q13 0 22.5 9.5t9.5 22.5zm128 704V416q0-13-9.5-22.5T1632 384H160q-13 0-22.5 9.5T128 416v832q0 13 9.5 22.5t22.5 9.5h1472q13 0 22.5-9.5t9.5-22.5zm128-1088v1088q0 66-47 113t-113 47H160q-66 0-113-47T0 1248V160Q0 94 47 47T160 0h1472q66 0 113 47t47 113z"/></symbol>\
  <symbol viewBox="0 0 1536 1536" id="icon-wpforms"><path d="M515 783v128H263V783h252zm0-255v127H263V528h252zm758 511v128H932v-128h341zm0-256v128H601V783h672zm0-255v127H601V528h672zm135 860V148q0-8-6-14t-14-6h-32L978 384 768 213 558 384 180 128h-32q-8 0-14 6t-6 14v1240q0 8 6 14t14 6h1240q8 0 14-6t6-14zM553 278l185-150H332zm430 0l221-150H798zm553-130v1240q0 62-43 105t-105 43H148q-62 0-105-43T0 1388V148Q0 86 43 43T148 0h1240q62 0 105 43t43 105z"/></symbol>\
  <symbol id="icon-persons" viewBox="0 0 1024 1024"><path d="M409.6 481.28c128 0 232.96-104.96 232.96-232.96S537.6 15.36 409.6 15.36 176.64 120.32 176.64 248.32c0 130.56 104.96 232.96 232.96 232.96zm215.04-35.84c15.36 2.56 30.72 10.24 46.08 10.24 97.28 0 174.08-79.36 174.08-174.08S768 104.96 673.28 104.96h-10.24c23.04 43.52 38.4 92.16 38.4 145.92 0 74.24-28.16 143.36-76.8 194.56zM673.28 512c-25.6 0-51.2 2.56-79.36 10.24 156.16 66.56 268.8 217.6 279.04 399.36h89.6c30.72 0 58.88-25.6 58.88-58.88 0-192-156.16-350.72-348.16-350.72zM409.6 542.72c-225.28 0-407.04 184.32-407.04 407.04 0 17.92 0 58.88 58.88 58.88h701.44c58.88 0 58.88-40.96 58.88-58.88-2.56-225.28-186.88-407.04-412.16-407.04zm0 0"/></symbol>\
  <symbol id="icon-stack" viewBox="0 0 512 512"><path d="M12.41 148.02l232.94 105.67c6.8 3.09 14.49 3.09 21.29 0l232.94-105.67c16.55-7.51 16.55-32.52 0-40.03L266.65 2.31a25.607 25.607 0 0 0-21.29 0L12.41 107.98c-16.55 7.51-16.55 32.53 0 40.04zm487.18 88.28l-58.09-26.33-161.64 73.27c-7.56 3.43-15.59 5.17-23.86 5.17s-16.29-1.74-23.86-5.17L70.51 209.97l-58.1 26.33c-16.55 7.5-16.55 32.5 0 40l232.94 105.59c6.8 3.08 14.49 3.08 21.29 0L499.59 276.3c16.55-7.5 16.55-32.5 0-40zm0 127.8l-57.87-26.23-161.86 73.37c-7.56 3.43-15.59 5.17-23.86 5.17s-16.29-1.74-23.86-5.17L70.29 337.87 12.41 364.1c-16.55 7.5-16.55 32.5 0 40l232.94 105.59c6.8 3.08 14.49 3.08 21.29 0L499.59 404.1c16.55-7.5 16.55-32.5 0-40z"/></symbol></defs></svg></div>');

    // 统计
    if (/inx/.test(location.host)) {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = '//www.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    }
})();
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-11205167-1']);
_gaq.push(['_trackPageview']);
