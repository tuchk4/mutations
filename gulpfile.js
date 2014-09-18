var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');

// Basic usage
gulp.task('commonjs', function() {
  // Single entry point to browserify
  gulp.src('src/index.js')
    .pipe(browserify({
      insertGlobals: false,
      debug: false,
      standalone: 'mutate'
    }))
    .pipe(rename('build.js'))
    .pipe(gulp.dest('./build/'))
});

gulp.task('default', ['commonjs']);