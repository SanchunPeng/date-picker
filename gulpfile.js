/**
 * Created by meathill on 2017/2/18.
 */

const fs = require('fs');
const gulp = require('gulp');
const sequence = require('run-sequence');
const stylus = require('gulp-stylus');
const cleanCSS = require('gulp-clean-css');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const base64 = require('gulp-base64');
const replace = require('gulp-replace');
const header = require('gulp-header');
const event = require('event-stream');
const marked = require('marked');
const del = require('del');
const DEST = 'build/';
const DOC = 'docs/';
const CDN = require('./cdn.json');
const pkg = require('./package.json');

let info = `/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 * @author ${pkg.author}
 *
 * 天气宝 http://baotianqi.cn/
 * built at ${new Date()}
 */
`;

gulp.task('sourcemap', () => {
  gulp.src('dist/*.js')
    .pipe(replace(/\/\/# sourceMap[\S]+/gi, ''))
    .pipe(gulp.dest('dist/'));
});

gulp.task('clear', () => {
  return del([DEST, DOC]);
});

gulp.task('stylus', () => {
  return gulp.src('./styl/screen.styl')
    .pipe(stylus({
      compress: true
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(base64())
    .pipe(header(info))
    .pipe(rename('tqb-date-picker.min.css'))
    .pipe(gulp.dest(DEST + 'css/'));
});

gulp.task('theme', () => {
  return gulp.src('./styl/theme/*.styl')
    .pipe(stylus({
      compress: true
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(header(info))
    .pipe(gulp.dest(DEST + 'css/'));
});

gulp.task('webpack', () => {
  return gulp.src('app/main.js')
    .pipe(webpackStream( require('./webpack.config.build'), webpack))
    .pipe(uglify())
    .pipe(header(info))
    .pipe(gulp.dest(DEST + 'js/'));
});

gulp.task('html', () => {
  let readme = marked(fs.readFileSync('./README.md', 'utf8'));
  return gulp.src('./index.dev.html')
    .pipe(replace(/node_modules\/([\w]+)\/(dist\/)?/g, (match, repo) => {
      return CDN[repo];
    }))
    .pipe(replace('"dist/', '"js/'))
    .pipe(replace('bundle.js', 'min.js'))
    .pipe(replace('screen.css', 'tqb-date-picker.min.css'))
    .pipe(replace(/<section id="sample"[\S\s]+?<\/section>/, ''))
    .pipe(replace('<!-- readme -->', readme))
    .pipe(replace('<table>', '<table class="table">'))
    .pipe(replace('lang-html', 'lang-html language-html'))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(DOC));
});

gulp.task('copy', () => {
  return event.merge(
    gulp.src('build/**').pipe(gulp.dest(DOC)),
    gulp.src(['css/sample.css'])
      .pipe(replace(/\/\*# sourceMappingURL=[\S]+ \*\//g, ''))
      .pipe(gulp.dest(DOC + 'css/'))
  );
});

gulp.task('default', callback => {
  sequence('clear',
    ['stylus', 'theme', 'webpack', 'html'],
    'copy',
    callback
  );
});