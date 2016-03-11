var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('default', function () {
  gulp.src('src/sticky-row-table.js')
    .pipe(concat('sticky-row-table.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./build/'));
});
