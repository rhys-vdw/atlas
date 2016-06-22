/* eslint no-console:0 */

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const exec = require('child_process').exec;
const clean = require('gulp-clean');

const TEST_CMD = 'node compiled-tests/index.js | $(npm bin)/tap-colorize';

gulp.task('build', ['clean-lib'], () => {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));
});

gulp.task('clean-lib', () => {
  return gulp.src('lib/**/*.js', { read: false })
   .pipe(clean());
});

gulp.task('clean-compiled-tests', () => {
  return gulp.src('compiled-tests/**/*.js', { read: false })
   .pipe(clean());
});

gulp.task('build-tests', ['clean-compiled-tests'], () => {
  return gulp.src('tests/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('compiled-tests'));
});

gulp.task('default', () => {
  gulp.watch(['src/**/*.js', 'tests/**/*.js'], ['build-and-test']);
});

function runTests(callback) {
  exec(TEST_CMD, (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
}

gulp.task('build-and-test', ['build', 'build-tests'], runTests);
gulp.task('test', runTests);
