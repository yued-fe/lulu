var gulp = require('gulp');
var sass = require('gulp-sass');
//清空文件
var clean = require('gulp-clean');
var concat = require('gulp-concat');

// 或者之前的modern
var theme = 'peak';

var path = {
    'sass': './theme/' + theme + '/sass',
    'css': './theme/' + theme + '/css',
    'js': './theme/' + theme + '/js'
};

var fileUiJs = ['Keyboard.js', 'Follow.js', 'Enhance.js', 'Tab.js', 'Drop.js', 'DropList.js', 'DropPanel.js', 'Tips.js', 'LightTip.js', 'ErrorTip.js', 'Loading.js', 'Dialog.js', 'Datalist.js', 'Select.js', 'DateTime.js', 'Color.js', 'Range.js', 'Placeholder.js', 'Radio.js', 'Checkbox.js', 'Validate.js', 'Pagination.js'];
var fileCompJs = ['Form.js', 'Table.js'];

// 组装需要合并的JS
var fileJS = [];
fileUiJs.forEach(function (filename) {
    fileJS.push(path.js + '/common/ui/' + filename);
});
fileCompJs.forEach(function (filename) {
    fileJS.push(path.js + '/common/comp/' + filename);
});

// 清空CSS
gulp.task('clean', function() {
    gulp.src([path.css + '/**/*.css'], {read: false})
        .pipe(clean());
});

// 默认任务
gulp.task('default', ['clean', 'sass:ui', 'sass:common', 'sass:comp', 'concat:js'], function () {
    gulp.start('sass:watch');
});

gulp.task('concat:js', function () {
    console.log('合并所有JS');
    return gulp.src(fileJS)
        .pipe(concat('all.js'))
        .pipe(gulp.dest(path.js + '/common'));
});

gulp.task('sass:ui', function () {
    console.log('编译sass:ui');

    return gulp.src(path.sass + '/common/ui/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.css + '/common/ui'));
});

gulp.task('sass:common', function () {
    console.log('编译sass:common');

    return gulp.src(path.sass + '/common/!(variable)*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.css + '/common'));
});

gulp.task('sass:comp', function () {
    console.log('编译sass:comp');

    return gulp.src(path.sass + '/common/comp/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.css + '/common/comp'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./theme/' + theme + '/sass/**/*.scss', ['sass:ui', 'sass:common', 'sass:comp']);
});
