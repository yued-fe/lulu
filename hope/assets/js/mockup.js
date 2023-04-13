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

    // 主题下拉选择
    eleSelectTheme.addEventListener('change', function () {
        // 切换主题
        var pathname = location.pathname;
        if (/html$/.test(this.value)) {
            location.replace(this.value);
            return;
        }
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
            urlPure = pathname.replace(/\/(?:pure|edge|hope)\//, '/' + this.value + '/');

            if (urlPure.indexOf('hope') !== -1) {
                urlPure = urlPure.replace('about.', '').replace('apis.', '').replace('example.', '');
            } else if (pathname.indexOf('hope') !== -1) {
                urlPure = pathname.replace('hope/', this.value + '/apis.');
            }

            location.replace(urlPure);
        }
    });

    // progress组件peak版本没有，故删除
    if (location.pathname.indexOf('progress.html') != -1) {
        document.querySelector('#selectTheme option[value="peak"]').remove();
    }

    document.body.insertAdjacentHTML('afterbegin', '<div hidden><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><defs><symbol id="icon-persons" viewBox="0 0 1024 1024"><path d="M409.6 481.28c128 0 232.96-104.96 232.96-232.96S537.6 15.36 409.6 15.36 176.64 120.32 176.64 248.32c0 130.56 104.96 232.96 232.96 232.96zm215.04-35.84c15.36 2.56 30.72 10.24 46.08 10.24 97.28 0 174.08-79.36 174.08-174.08S768 104.96 673.28 104.96h-10.24c23.04 43.52 38.4 92.16 38.4 145.92 0 74.24-28.16 143.36-76.8 194.56zM673.28 512c-25.6 0-51.2 2.56-79.36 10.24 156.16 66.56 268.8 217.6 279.04 399.36h89.6c30.72 0 58.88-25.6 58.88-58.88 0-192-156.16-350.72-348.16-350.72zM409.6 542.72c-225.28 0-407.04 184.32-407.04 407.04 0 17.92 0 58.88 58.88 58.88h701.44c58.88 0 58.88-40.96 58.88-58.88-2.56-225.28-186.88-407.04-412.16-407.04zm0 0"/></symbol>');

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
