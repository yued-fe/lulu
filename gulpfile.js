var gulp = require('gulp');
var sass = require('gulp-sass');
//清空文件
var clean = require('gulp-clean');

// 或者之前的modern
var theme = 'peak';

var path = {
    'sass': './theme/' + theme + '/sass',
    'css': './theme/' + theme + '/css',
    'js': './theme/' + theme + '/js'
};

// 清空CSS
gulp.task('clean', function() {
    gulp.src([path.css + '/**/*.css'], {read: false})
        .pipe(clean());
});

// 默认任务
gulp.task('default', ['clean', 'sass:ui', 'sass:common', 'sass:comp'], function () {
    gulp.start('sass:watch');
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
