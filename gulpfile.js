/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var gulp = require('gulp');
var rimraf = require('del');
var transport = require('gulp-cmd');
var uglify = require('gulp-uglify');
var css = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var colors = transport.colors;

// alias
var alias = {
  'jquery': 'base/jquery/1.11.2/jquery',
  'base': 'base/base/1.2.0/base',
  'class': 'base/class/1.2.0/class',
  'events': 'base/events/1.2.0/events',
  'widget': 'base/widget/1.2.0/widget',
  'template': 'base/template/3.0.3/template',
  'templatable': 'base/templatable/0.10.0/templatable',
  'iframe-shim': 'util/iframe-shim/1.1.0/iframe-shim',
  'position': 'util/position/1.1.0/position',
  'messenger': 'util/messenger/2.1.0/messenger',
  'mask': 'common/overlay/1.2.0/mask',
  'overlay': 'common/overlay/1.2.0/overlay',
  'dialog': 'common/dialog/1.5.1/dialog',
  'confirmbox': 'common/dialog/1.5.1/confirmbox'
};

var startTime = Date.now();

// complete callback
function complete(){
  var now = new Date();

  console.log(
    '  %s [%s] build complete ... %s%s',
    colors.verbose('gulp-cmd'),
    now.toLocaleString(),
    colors.info(now - startTime),
    colors.verbose('ms')
  );
}

// clean task
gulp.task('clean', function (callback){
  rimraf('online', callback);
});

// runtime task
gulp.task('runtime', ['clean'], function (){
  gulp.src('assets/loader/**/*.js', { base: 'assets' })
    .pipe(uglify())
    .pipe(gulp.dest('online'));

  gulp.src('assets/?(loader|images)/**/*.!(js)', { base: 'assets' })
    .pipe(gulp.dest('online'));
});

// online task
gulp.task('online', ['runtime'], function (){
  // all js
  gulp.src('assets/js/**/*.js', { base: 'assets/js' })
    .pipe(transport({
      alias: alias,
      ignore: ['jquery'],
      include: function (id){
        return id.indexOf('view') === 0 ? 'all' : 'relative';
      },
      oncsspath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  // other file
  gulp.src('assets/js/**/*.!(js|css|json|tpl|html)')
    .pipe(gulp.dest('online/js'));

  // css
  gulp.src('assets/css/**/*.*')
    .pipe(css({ compatibility: 'ie8' }))
    .pipe(gulp.dest('online/css'));
});

// develop task
gulp.task('default', ['runtime'], function (){
  // all file
  gulp.src('assets/js/**/*.*', { base: 'assets/js' })
    .pipe(transport({
      alias: alias,
      include: 'self',
      oncsspath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  gulp.src('assets/css/**/*.*', { base: 'assets' })
    .pipe(gulp.dest('online'));
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = path.join(process.cwd(), 'assets');

  // watch all file
  gulp.watch('assets/js/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      startTime = Date.now();

      gulp.src(e.path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(transport({
          alias: alias,
          include: 'self',
          cache: false,
          oncsspath: function (path){
            return path.replace('assets/', 'online/')
          }
        }))
        .pipe(gulp.dest('online/js'))
        .on('end', complete);
    }
  });

  // watch all file
  gulp.watch('assets/?(images|loader|css)/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      startTime = Date.now();

      gulp.src(e.path, { base: 'assets' })
        .pipe(plumber())
        .pipe(gulp.dest('online'))
        .on('end', complete);
    }
  });
});
