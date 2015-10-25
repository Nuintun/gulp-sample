/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

// 开启 DEBUG 开关
process.env.DEBUG = 'gulp-*';

// 关闭 DEBUG 开关
//process.env.DEBUG = 'false';

var path = require('path');
var join = path.join;
var relative = path.relative;
var dirname = path.dirname;
var extname = path.extname;
var resolve = path.resolve;
var gulp = require('gulp');
var rimraf = require('del');
var uglify = require('gulp-uglify');
var css = require('gulp-css');
var cmd = require('gulp-cmd');
var colors = cmd.colors;
var pedding = require('pedding');
var chokidar = require('chokidar');
var plumber = require('gulp-plumber');
var switchStream = require('switch-stream');

// alias
var alias = {
  'import-style': 'util/import-style/1.0.0/import-style',
  'jquery': 'base/jquery/1.11.3/jquery',
  'base': 'base/base/1.2.0/base',
  'class': 'base/class/1.2.0/class',
  'events': 'base/events/1.2.0/events',
  'widget': 'base/widget/1.2.0/widget',
  'template': 'base/template/3.0.3/template',
  'templatable': 'base/templatable/0.10.0/templatable',
  'iframe-shim': 'util/iframe-shim/1.1.0/iframe-shim',
  'position': 'util/position/1.1.0/position',
  'messenger': 'util/messenger/2.1.0/messenger',
  'overlay': 'common/overlay/1.2.0/',
  'dialog': 'common/dialog/1.5.1/dialog',
  'confirmbox': 'common/dialog/1.5.1/confirmbox'
};
// bookmark
var bookmark = Date.now();

// file watch
function watch(glob, options, callabck){
  if (typeof options === 'function') {
    callabck = options;
    options = {};
  }

  // ignore initial add event
  options.ignoreInitial = true;

  // get watcher
  var watcher = chokidar.watch(glob, options);

  // bing event
  if (callabck) {
    watcher
      .on('all', callabck);
  }

  // return watcher
  return watcher;
}

// css resource path
function onpath(path, property, file, wwwroot){
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.indexOf('.') === 0) {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  path = path.replace('/static/develop/', '/static/product/');

  return path;
}

// date format
function dateFormat(date, format){
  // 参数错误
  if (!date instanceof Date) {
    throw new TypeError('Param date must be a Date');
  }

  format = format || 'yyyy-MM-dd hh:mm:ss';

  var map = {
    'M': date.getMonth() + 1, //月份
    'd': date.getDate(), //日
    'h': date.getHours(), //小时
    'm': date.getMinutes(), //分
    's': date.getSeconds(), //秒
    'q': Math.floor((date.getMonth() + 3) / 3), //季度
    'S': date.getMilliseconds() //毫秒
  };

  format = format.replace(/([yMdhmsqS])+/g, function (all, t){
    var v = map[t];

    if (v !== undefined) {
      if (all.length > 1) {
        v = '0' + v;
        v = v.substr(v.length - 2);
      }

      return v;
    } else if (t === 'y') {
      return (date.getFullYear() + '').substr(4 - all.length);
    }

    return all;
  });

  return format;
}

// clean task
gulp.task('clean', function (){
  bookmark = Date.now();

  rimraf.sync('static/product');
});

// runtime task
gulp.task('runtime', ['clean'], function (){
  // loader file
  gulp.src('static/develop/loader/**/*.js', { base: 'static/develop' })
    .pipe(gulp.dest('static/product'));

  // image file
  gulp.src('static/develop/images/**/*', { base: 'static/develop' })
    .pipe(gulp.dest('static/product'));
});

// runtime product task
gulp.task('runtime-product', ['clean'], function (){
  // loader file
  gulp.src('static/develop/loader/**/*.js', { base: 'static/develop' })
    .pipe(uglify())
    .pipe(gulp.dest('static/product'));

  // image file
  gulp.src('static/develop/images/**/*', { base: 'static/develop' })
    .pipe(gulp.dest('static/product'));
});

// product task
gulp.task('product', ['runtime-product'], function (){
  // complete callback
  var complete = pedding(2, function (){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.green('gulp-product'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  });

  // compress javascript file
  function compress(){
    return switchStream(function (vinyl){
      if (extname(vinyl.path) === '.js') {
        return 'js';
      }
    }, {
      'js': uglify()
    });
  }

  // all js
  gulp.src('static/develop/js/**/*', { base: 'static/develop/js' })
    .pipe(cmd({
      alias: alias,
      ignore: ['jquery'],
      include: function (id){
        return id && id.indexOf('view') === 0 ? 'all' : 'self';
      },
      css: {
        compress: true,
        onpath: onpath
      }
    }))
    .pipe(compress())
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // css file
  gulp.src('static/develop/css/?(base|view)/**/*', { base: 'static/develop' })
    .pipe(css({
      include: true,
      compress: true,
      onpath: onpath
    }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// develop task
gulp.task('default', ['runtime'], function (){
  // complete callback
  var complete = pedding(2, function (){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.green('gulp-default'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  });

  // js file
  gulp.src('static/develop/js/**/*', { base: 'static/develop/js' })
    .pipe(cmd({
      alias: alias,
      include: 'self',
      css: { onpath: onpath }
    }))
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // css file
  gulp.src('static/develop/css/**/*', { base: 'static/develop' })
    .pipe(css({ onpath: onpath }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = join(process.cwd(), 'static/develop');

  // debug watcher
  function debugWatcher(event, path){
    var now = new Date();

    console.log(
      '  %s %s: %s %s',
      colors.green('gulp-watch'),
      event,
      colors.magenta(join('static/develop', path).replace(/\\/g, '/')),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  }

  // complete callback
  function complete(){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.green('gulp-watch'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  }

  // watch js file
  watch('static/develop/js', function (event, path){
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', rpath));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop/js' })
        .pipe(plumber())
        .pipe(cmd({
          alias: alias,
          include: 'self',
          cache: false,
          css: { onpath: onpath }
        }))
        .pipe(gulp.dest('static/product/js'))
        .on('finish', complete);
    }
  });

  // watch css file
  watch('static/develop/css', function (event, path){
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop' })
        .pipe(plumber())
        .pipe(css({
          onpath: function (path){
            return path.replace('static/develop/', 'static/product/')
          }
        }))
        .pipe(gulp.dest('static/product'))
        .on('finish', complete);
    }
  });

  // watch image file
  watch('static/develop/images', function (event, path){
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop' })
        .pipe(gulp.dest('static/product'))
        .on('finish', complete);
    }
  });
});
