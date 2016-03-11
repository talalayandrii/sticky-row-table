var gulp = require('gulp');
var uglify = require('gulp-uglifyjs');

gulp.task('default', function () {
  gulp.src('src/sticky-row-table.js')
    .pipe(uglify('sticky-row-table.min.js'))
    .pipe(gulp.dest('./build/'));
});
