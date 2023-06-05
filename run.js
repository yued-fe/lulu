/*
 * LuLu UI开发node.js脚本
 * 1. 实时CSS合并;
 * 2. 实时JS合并；
 * 3. 实时html编译;
*/

/* global console, process */

const fs = require('fs');

const path = require('path');
const url = require('url');

const http = require('http');
const https = require('https');

const os = require('os');
const child_process = require('child_process');

let args = process.argv.splice(2);
if (args.length == 0) {
    args = ['pure', 'edge', 'hope'];
}

String.prototype.theme = function (theme) {
    return this.replace('${theme}', theme || 'pure');
};

/*
** 文件合并方法
** @params arrUrls Array 需要合并的文件或文件夹（文件夹会合并其中所有1级文件）
** @params strUrl String 合并后的文件名称
*/

const combo = function (arrUrls, strUrl, filter) {
    var content = '';
    if (fs.existsSync(strUrl) == false) {
        console.error(strUrl + '不存在，合并失败');
        return;
    }
    // 遍历url并读取文件内容
    if (arrUrls && arrUrls.length && strUrl) {
        arrUrls.forEach(function (url) {
            if (fs.existsSync(url) == false) {
                return;
            }

            let st = fs.statSync(url);
            if (st.isFile()) {
                // 如果是文件
                content += fs.readFileSync(url);
            } else if (st.isDirectory()) {
                // 作为文件夹
                fs.readdirSync(url).forEach(function (filename) {
                    let dir = path.join(url, filename);
                    if (fs.statSync(dir).isFile()) {
                        content += fs.readFileSync(dir);
                    }
                });
            }
        });

        if (typeof filter == 'function') {
            content = filter(content);
        }

        // 写入新目录
        // 写入项目配置数据
        fs.writeFile(strUrl, content.trim(), function () {
            console.log('资源合并为' + strUrl + '成功');
        });
    }
};


/*
** 删除文件极其目录方法
** @src 删除的目录
*/
const clean = function (src) {
    if (!fs.existsSync(src)) {
        return;
    }

    // 读取目录中的所有文件/目录
    var paths = fs.readdirSync(src);

    paths.forEach(function (dir) {
        let _src = path.join(src, dir);

        let st = fs.statSync(_src);

        if (st.isFile()) {
            // 如果是文件，则删除
            fs.unlinkSync(_src);
        } else if (st.isDirectory()) {
            // 作为文件夹
            clean(_src);
        }
    });

    // 删除文件夹
    try {
        fs.rmdirSync(src);
        console.log('已清空文件夹' + src);
    } catch(e) {}
};


/*
** 创建路径对应的文件夹（如果没有）
** @params path 目标路径
*/
const createPath = function (path) {
    // 路径有下面这几种
    // 1. /User/...      OS X
    // 2. E:/mydir/...   window
    // 3. a/b/...        下面3个相对地址，与系统无关
    // 4. ./a/b/...
    // 5. ../../a/b/...

    path = path.replace(/\\/g, '/');

    var pathHTML = '.';
    if (path.slice(0, 1) == '/') {
        pathHTML = '/';
    } else if (/:/.test(path)) {
        pathHTML = '';
    }

    path.split('/').forEach(function (filename) {
        if (filename) {
            // 如果是数据盘地址，忽略
            if (/:/.test(filename) == false) {
                pathHTML = pathHTML + '/' + filename;
                // 如果文件不存在
                if (!fs.existsSync(pathHTML)) {
                    console.log('路径' + pathHTML + '不存在，新建之');
                    fs.mkdirSync(pathHTML);
                }
            } else {
                pathHTML = filename;
            }
        }
    });
};


/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
const copy = function (src, dst) {
    if (!fs.existsSync(src)) {
        return;
    }

    if (!fs.existsSync(dst)) {
        fs.mkdirSync(dst);
    }

    // 读取目录中的所有文件/目录
    var paths = fs.readdirSync(src);

    paths.forEach(function (dir) {
        var _src = path.join(src, dir);
        var _dst = path.join(dst, dir);
        var readable, writable;

        let st = fs.statSync(_src);

        // 判断是否为文件
        if (st.isFile()) {
            // 创建读取流
            readable = fs.createReadStream(_src);
            // 创建写入流
            writable = fs.createWriteStream(_dst);
            // 通过管道来传输流
            readable.pipe(writable);
        } else if (st.isDirectory()) {
            // 作为文件夹处理
            createPath(_dst);
            copy(_src, _dst);
        }
    });
};

/**
 * 获取线上资源
 * @param {*}  
 * @param {*} success 
 * @param {*} error 
 */
const getHttpsData = function (url, success = function () {}, error = function () {}) {  
    https.get(url, function (res) {
      var statusCode = res.statusCode;
  
      if (statusCode !== 200) {
          // 出错回调
          error();
          // 消耗响应数据以释放内存
          res.resume();
          return;
      }
  
      res.setEncoding('utf8');
      var rawData = '';
      res.on('data', function (chunk) {
        rawData += chunk;
      });
  
      // 请求结束
      res.on('end', function () {
        // 成功回调
        success(rawData);
      }).on('error', function (e) {
        // 出错回调
        error();
      });
    });
  };

/*
** 文档同步更新的方法
*/
const ayncDocs = function () {
    // 遍历文件夹下的文件
    const dirDocs = './docs';
    // 如果不存在docs文件，则新建之
    if (!fs.existsSync(dirDocs)) {
        fs.mkdirSync(dirDocs);
    }

    // 获取当前本地文档的版本
    let version = '';
    let pathVersiontxt = path.join(dirDocs, 'version.txt');
    if (fs.existsSync(pathVersiontxt)) {
        version = fs.readFileSync(pathVersiontxt, 'utf-8');
    }

    // 拉取线上资源
    let versionOnline = '0';

    console.log('正在获取文档版本...');

    getHttpsData('https://raw.githubusercontent.com/yued-fe/lulu/gh-pages/version.txt', function (txt) {
        versionOnline = txt;

        console.log('文档版本文件获取成功，版本是：' + versionOnline);

        // 和线上文档版本不一致
        if (versionOnline !== version) {
            // 提醒下，就不强制更新了，除非本地文档是空的
            if (version) {
                console.warn('本地文档和线上文档版本不一致，如要更新，可以删除docs文件夹，再执行一遍node run');
            } else {
                // 使用 git 指令把 文档分支中的文件复制过来
                console.log('开始复制文档资源...');

                // 复制文档
                child_process.exec('git show gh-pages:index.html > ' + path.join(dirDocs, 'index.html'), function (err) {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        return;
                    }
                    console.log('index.html复制成功');
                });  

                // 需要复制的资源
                const sourceCopy = ['pure', 'edge', 'hope'];
                let indexCopy = 0;
                const stepCopy = function () {
                    const dir = sourceCopy[indexCopy];
                    if (!dir) {
                        setTimeout(() => {
                            // 清除这几个文件
                            sourceCopy.forEach(dir => clean(dir));
                        }, 200);

                        // 写入版本
                        if (version === '') {
                            fs.writeFile(pathVersiontxt, versionOnline, (err) => {
                                if (err) {
                                    console.error(`exec error: ${err}`);
                                    return;
                                }
                                console.log('版本文件写入成功');
                            });
                        }

                        return;
                    }
                    // 遍历复制
                    child_process.exec('git checkout gh-pages -- ' + dir, function (err) {
                        if (err) {
                            console.error(`exec error: ${err}`);
                            return;
                        }

                        copy(dir, path.join(dirDocs, dir));

                        console.log(dir + '复制成功');

                        // 下一个文件夹复制
                        indexCopy++;

                        stepCopy();
                    });  
                };

                stepCopy();
            }
        }
    });
};


const pathThemeCSS = './theme/${theme}/css/common';
const pathThemeJS = './theme/${theme}/js/common';

const pathThemeDocsSrc = './docs-edit/${theme}';
const pathThemeDocsDist = './docs/${theme}';

// 任务
const task = {
    css: {
        common: function (pathCSS) {
            var arrPathSrc = [pathCSS + '/ui', pathCSS + '/comp'];
            if (/edge/i.test(pathCSS)) {
                arrPathSrc.unshift(pathCSS + '/variables.css');
            }
            // 合并为common.css
            combo(arrPathSrc, pathCSS + '/ui.css', function (css) {
                return '@charset "UTF-8";' + css.replace(/@charset "UTF-8";/g, '');
            });
        },
        form: function (pathCSS) {
            // 合并为form.css
            combo([
                pathCSS + '/variables.css',
                pathCSS + '/ui/Button.css',
                pathCSS + '/ui/Checkbox.css',
                pathCSS + '/ui/Color.css',
                pathCSS + '/ui/Date.css',
                pathCSS + '/ui/Input.css',
                pathCSS + '/ui/Placeholder.css',
                pathCSS + '/ui/Progress.css',
                pathCSS + '/ui/Radio.css',
                pathCSS + '/ui/Range.css',
                pathCSS + '/ui/Select.css',
                pathCSS + '/ui/Switch.css',
                pathCSS + '/ui/Textarea.css'
            ], pathCSS + '/form.css', function (css) {
                return '@charset "UTF-8";' + css.replace(/@charset "UTF-8";/g, '');
            });
        },
        init: function (theme) {
            let pathCSS = pathThemeCSS.theme(theme);
            // 资源清理
            this.common(pathCSS);
            this.form(pathCSS);
        }
    },
    js: {
        common: function (pathJS, theme) {
            // ui组建合并为all.js
            combo([
                pathJS + '/ui/Keyboard.js',
                pathJS + '/ui/Follow.js',
                pathJS + '/ui/Tab.js',
                pathJS + '/ui/Select.js',
                pathJS + '/ui/Drop.js',
                pathJS + '/ui/Tips.js',
                pathJS + '/ui/LightTip.js',
                pathJS + '/ui/ErrorTip.js',
                pathJS + '/ui/Loading.js',
                pathJS + '/ui/Range.js',
                pathJS + '/ui/Color.js',
                pathJS + '/ui/Dialog.js',
                pathJS + '/ui/Datalist.js',
                pathJS + '/ui/DateTime.js',
                pathJS + '/ui/Validate.js',
                pathJS + '/ui/Pagination.js',
                pathJS + '/comp/Table.js',
                pathJS + '/comp/Form.js'
            ], pathJS + '/all.js', function (js) {
                // 过滤import和export语句
                if (theme == 'edge') {
                    return js.replace(/^(import|export) /gm, '// $1 ').replace(/^\/\*\*/gm, '\n/**');
                }
                return js.replace(/\s+if \(typeof exports ===[\w\W]+?\} else \{([\w\W]+?)\}\s+/gm, '$1').replace(/\s+if \(typeof require ===? [\w\W]+? return \{\};(\r|\n)+\s+}/gm, '').replace(/\/\* global module \*\//g, '').replace(/, function \(require\) \{/g, ', function () {').replace(/\s{8}(\w[\w\W]+?factory)/g, '    $1');
            });
        },
        init: function (theme) {
            let pathJS = pathThemeJS.theme(theme);
            // 两个合并
            this.common(pathJS, theme);
        }
    }
};

const HOPE_ROOT = './theme/hope/ui/';

const taskHope = {
    css () {
        let arrUrls = [
            HOPE_ROOT + 'variables.css',
            HOPE_ROOT + 'reset.css'
        ];
        // 再加入各个文件夹下的 CSS 文件
        fs.readdirSync(HOPE_ROOT).forEach(function (filename) {
            let dir = path.join(HOPE_ROOT, filename);
            if (fs.statSync(dir).isDirectory()) {
                // 作为文件夹
                fs.readdirSync(dir).forEach(function (filename) {
                    if (/css$/.test(filename)) {
                        let file = path.join(dir, filename);
                        if (fs.statSync(file).isFile()) {
                            arrUrls.push(file);
                        }
                    }
                });
            }
        });

        // 合并为common.css
        combo(arrUrls, HOPE_ROOT + 'ui.css', function (css) {
            return '@charset "UTF-8";' + css.replace(/@charset "UTF-8";/gi, '').replace(/@import[\w\W]+?;/gi, '');
        });
    },

    // hope JS 合并
    js () {
        let arrUrls = [];
        // 再加入各个文件夹下的 CSS 文件
        fs.readdirSync(HOPE_ROOT).forEach(function (filename) {
            let dir = path.join(HOPE_ROOT, filename);
            if (fs.statSync(dir).isDirectory()) {
                // 作为文件夹
                fs.readdirSync(dir).forEach(function (filename) {
                    if (/js$/.test(filename)) {
                        let file = path.join(dir, filename);
                        if (fs.statSync(file).isFile()) {
                            arrUrls.push(file);
                        }
                    }
                });
            }
        });

        // 合并为common.css
        combo(arrUrls, HOPE_ROOT + 'all.js', function (js) {
            return `/*JS 合集*/
(async () => {
    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
        await import('./safari-polyfill.js');
    }` + js.replace(/\/\*\*\/[\w\W]+?\n/g, '').replace(/\/\*[\w\W]+?\*\//gm, '') + `})();`;
        });
    }
};

// 一开始第一次任务
args.forEach(function (theme) {
    console.log('开始' + theme + '主题的初始任务...');

    if (theme != 'hope') {
        for (var keyTask in task) {
            task[keyTask].init(theme);
        }
    } else {
        taskHope.css();
        taskHope.js();
    }
});

// 文档获取
ayncDocs();


// 开启watch任务

// CSS监控任务
let timerCommonCSS;
let timerUIJS;

args.forEach(function (theme) {
    if (theme == 'hope') {
        // hope 主题 CSS 和 JS 在一个文件夹下面，所以监控任务是一起的
        fs.watch(HOPE_ROOT, {
            recursive: true
        }, (eventType, filename) => {
            if (/css$/.test(filename) && filename.indexOf('ui') == -1) {
                // 定时器让多文件同时变更只会只会执行一次合并
                clearTimeout(timerCommonCSS);
                console.log(filename + '发生了' + eventType + '变化');
                timerCommonCSS = setTimeout(() => {
                    console.log('ui.css合并...');
                    taskHope.css();
                }, 100);
            } else if (/js$/.test(filename) && filename.indexOf('all') == -1) {
                clearTimeout(timerUIJS);
                console.log(filename + '发生了' + eventType + '变化');
                timerUIJS = setTimeout(() => {
                    console.log('all.js合并...');
                    taskHope.js();
                }, 100);
            }
        });

        return;
    }


    let pathCSS = pathThemeCSS.theme(theme);

    fs.watch(pathCSS + '/ui', {
        recursive: true
    }, (eventType, filename) => {
        // 定时器让多文件同时变更只会只会执行一次合并
        clearTimeout(timerCommonCSS);
        console.log(filename + '发生了' + eventType + '变化');
        timerCommonCSS = setTimeout(() => {
            console.log('ui.css合并...');
            task.css.common(pathCSS);
            console.log('form.css合并...');
            task.css.form(pathCSS);
        }, 100);
    });

    fs.watch(pathCSS + '/comp', {
        recursive: true
    }, (eventType, filename) => {
        // 定时器让多文件同时变更只会只会执行一次合并
        clearTimeout(timerCommonCSS);
        console.log(filename + '发生了' + eventType + '变化');
        timerCommonCSS = setTimeout(() => {
            console.log('ui.css合并...');
            task.css.common(pathCSS);
        }, 100);
    });

    if (theme == 'edge') {
        fs.watchFile(path.join(pathCSS, 'variables.css'), () => {
            // index.html顺便复制下
            // 定时器让多文件同时变更只会只会执行一次合并
            clearTimeout(timerCommonCSS);
            timerCommonCSS = setTimeout(() => {
                console.log('variables.css发生了变化, ui.css合并...');
                task.css.common(pathCSS);
            }, 100);
        });
    }
});

args.forEach(function (theme) {
    if (theme == 'hope') {
        // hope 主题 CSS 和 JS 在一个文件夹下面，所以监控任务是一起的

        return;
    }

    let pathJS = pathThemeJS.theme(theme);

    fs.watch(pathJS + '/ui', {
        recursive: true
    }, (eventType, filename) => {
        // 定时器让多文件同时变更只会只会执行一次合并
        clearTimeout(timerUIJS);
        console.log(filename + '发生了' + eventType + '变化');
        timerUIJS = setTimeout(() => {
            console.log('重新合并all.js...');
            task.js.common(pathJS, theme);
        }, 100);
    });
    fs.watch(pathJS + '/comp', {
        recursive: true
    }, (eventType, filename) => {
        // 定时器让多文件同时变更只会只会执行一次合并
        clearTimeout(timerUIJS);
        console.log(filename + '发生了' + eventType + '变化');
        timerUIJS = setTimeout(() => {
            console.log('重新合并all.js...');
            task.js.common(pathJS, theme);
        }, 100);
    });
});


setTimeout(function () {
    console.log(`LuLu UI ${args.join()}主题静态资源监控中...`);
}, 200);


const mimetype = {
    'css': 'text/css',
    'gif': 'image/gif',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'webp': 'image/webp',
    'js': 'text/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'swf': 'application/x-shockwave-flash',
    'woff': 'application/font-woff',
    'woff2': 'application/font-woff2',
    'ttf': 'application/x-font-ttf',
    'eot': 'application/vnd.ms-fontobject',
    'txt': 'text/plain',
    'wav': 'audio/x-wav',
    'mp3': 'audio/mpeg3',
    'mp4': 'video/mp4',
    'xml': 'text/xml'
};

// 创建server
const server = http.createServer(function (request, response) {
    var pathname = url.parse(request.url).pathname;
    var realPath = path.join('./', pathname);
    var ext = path.extname(realPath);
    if (!ext) {
        realPath = path.join(realPath, 'index.html');
        ext = path.extname(realPath);
    }
    ext = ext ? ext.slice(1) : 'unknown';

    let href = url.parse(request.url).href;
    if (ext != 'unknown' && /\./.test(href) == false && /[a-z]$/i.test(href)) {
        response.writeHead(302, {
            'Location': href + '/'
        });
        response.end();
        return;
    }

    fs.exists(realPath, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            response.write('This request URL ' + pathname + ' was not found on this server.');
            response.end();
        } else {
            // gtimg的js/css地址变成本地
            if (ext == 'html' || ext == 'css') {
                let theme = 'pure';
                if (/edge/.test(realPath)) {
                    theme = 'edge';
                } else if (/hope/.test(realPath)) {
                    theme = 'hope';
                }

                fs.readFile(realPath, 'utf8', function (err, data) {
                    if (err) {
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        response.end(err);
                    } else {
                        let contentType = mimetype[ext];
                        response.writeHead(200, {
                            'Content-Type': contentType
                        });

                        let regUrl = new RegExp('https:\\/\\/qidian.gtimg.com\\/lulu\\/' + theme, 'g');
                        if (ext == 'html') {
                            data = data.replace(regUrl, '../../theme/' + theme).replaceAll('https://unpkg.com/lu2/', '../../');
                        } else if (ext == 'css' && theme == 'hope') {
                            data = data.replace(regUrl, '..');
                        }

                        response.write(data, 'utf8');
                        response.end();
                    }
                });
                return;
            }

            fs.readFile(realPath, 'binary', function (err, file) {
                if (err) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    response.end(err);
                } else {
                    var contentType = mimetype[ext] || 'text/plain';
                    response.writeHead(200, {
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*'
                    });
                    response.write(file, 'binary');
                    response.end();
                }
            });
        }
    });
});

// 设置监听端口
let port = '10086';
let funStartPage = function (theme) {
    let startPage = '/about.use.html';
    if (theme == 'hope') {
        startPage = '/about.html';
    }
    return theme + startPage;
}
server.listen(port, '127.0.0.1', function () {

    setTimeout(function () {
        console.log('文档访问服务已启动，地址：\nhttp://localhost:10086/docs/' + funStartPage(args[0]));
        if (args.length > 1) {
            console.log('http://localhost:10086/docs/' + funStartPage(args[1]));
        }
        if (args.length > 2) {
            console.log('http://localhost:10086/docs/' + funStartPage(args[2]));
        }
    }, 200);
});

