/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var gulp = require('gulp');
var rimraf = require('del');
var colors = require('colors/safe');
var transport = require('gulp-cmd');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');

// set colors theme
colors.setTheme({
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  inputBold: ['grey', 'bold'],
  verboseBold: ['cyan', 'bold'],
  promptBold: ['grey', 'bold'],
  infoBold: ['green', 'bold'],
  dataBold: ['grey', 'bold'],
  helpBold: ['cyan', 'bold'],
  warnBold: ['yellow', 'bold'],
  debugBold: ['blue', 'bold'],
  errorBold: ['red', 'bold']
});

// alias
var alias = { 'base': 'base/base/1.2.0/base' };

// complete callback
function complete(){
  var now = new Date();

  console.log(
    '  %s [%s] %s',
    colors.verboseBold('gulp-cmd'),
    now.toLocaleString(),
    colors.infoBold('build complete ...')
  );
}

// clean task
gulp.task('clean', function (callback){
  rimraf('online', callback);
});

// runtime task
gulp.task('runtime', ['clean'], function (){
  // all js
  gulp.src('assets/loader/*.*')
    .pipe(gulp.dest('online/loader'))
    .on('end', complete);
});

// online task
gulp.task('online', ['runtime'], function (){
  // all js
  gulp.src('assets/js/**/*.js', { base: 'assets/js' })
    .pipe(transport({
      alias: alias,
      include: function (id){ return id.indexOf('view') === 0 ? 'all' : 'relative'; }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  // other file
  gulp.src('assets/js/**/*.!(js|css|json|tpl|html)')
    .pipe(gulp.dest('online/js'));
});

// develop task
gulp.task('default', ['runtime'], function (){
  // all file
  gulp.src('assets/js/**/*.*', { base: 'assets/js' })
    .pipe(transport({ alias: alias, include: 'self' }))
    .pipe(gulp.dest('online/js'))
    .on('end', complete);
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = path.join(process.cwd(), 'assets');

  // watch all file
  gulp.watch('assets/js/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      gulp.src(e.path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(transport({ alias: alias, include: 'self', cache: false }))
        .pipe(gulp.dest('online/js'))
        .on('end', complete);
    }
  });
});
