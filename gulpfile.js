const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
let imageResize = require('gulp-image-resize');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const composer = require('gulp-uglify/composer');

const imageminWebp = require('imagemin-webp');
const runSequence = require('run-sequence');
const del = require('del');
const es = require('event-stream');
const uglifyes = require('uglify-es');
const uglify = composer(uglifyes, console);
const browserSync = require('browser-sync');

const is_production = false;

//https://andy-carter.com/blog/a-beginners-guide-to-the-task-runner-gulp

const paths = {
    assets_root: {
        src: ['app/manifest.json', 'app/**/*.html', 'app/robots.txt', ],
        dest: './public'
    },
    placeholder: {
        src: 'app/placeholder/',
        filename: 'placeholder.md'
    },
    images: {
        src: ['app/images/**/*.{jpg,png,tiff,svg}', '!app/images/icons/**/*'],
        dest: 'public/images/'
    },
    styles_app: {
        src: 'app/styles/**/*.css',
        saveas: 'app',
        dest: 'public/styles/'
    },
    scripts_sw: {
        src: ['app/sw.js'],
        saveas: 'sw.js',
        dest: 'public/'
    },
    scripts_app: {
        src: ['app/scripts/namespace.js', 'app/scripts/data.js', 'app/scripts/app.js', 'app/scripts/sw-reg.js'],
        saveas: 'app',
        dest: 'public/scripts/'
    },
};

browserSync.create();

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */

function clean_build() {
    // You can use multiple globbing patterns as you would with `gulp.src`,
    // for example if you are using del 2.0 or above, return its promise
    return del(['public/**/*']);
}

function copy_assets() {

    return es.merge(
        // create folder structure with placeholders folder
        gulp.src([paths.placeholder.src + paths.placeholder.filename], {read: false})
            .pipe(gulp.dest(paths.scripts_app.dest))
            .pipe(clean()),
        gulp.src([paths.placeholder.src + paths.placeholder.filename], {read: false})
            .pipe(gulp.dest(paths.styles_app.dest))
            .pipe(clean()),

        gulp.src(paths.assets_root.src)
            .pipe(gulp.dest(paths.assets_root.dest)),

        gulp.src(paths.images.src)
            .pipe(gulp.dest(paths.images.dest)),

        gulp.src('app/images/icons/*')
            .pipe(gulp.dest('public/images/icons/')),

        gulp.src('app/scripts/sw-reg.js')
            .pipe(uglify())
            //pass in options to the stream
            .pipe(rename({
                basename: 'sw-reg',
                suffix: '.min'
            }))
            .pipe(gulp.dest('public/scripts/')),

        gulp.src('app/third_party/*')
            .pipe(gulp.dest('public/third_party/'))
    );
}

/*
 * Define our tasks using plain functions
 */
function styles_app() {
    return gulp.src(paths.styles_app.src)
    //.pipe(less())
        .pipe(cleanCSS())
        .pipe(cleanCSS({debug: false}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        //pass in options to the stream
        .pipe(rename({
            basename: paths.styles_app.saveas,
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.styles_app.dest));
}

function scripts_app() {

    gulp.src(paths.scripts_app.src, {sourcemaps: true})
        .pipe(babel())
        .pipe(concat(paths.scripts_app.saveas))
        //.pipe(uglify())
        //pass in options to the stream
        .pipe(rename({
            basename: paths.scripts_app.saveas,
            suffix: '.min.js'
        }))
        .pipe(gulp.dest(paths.scripts_app.dest));
}

function scripts_sw() {

    return gulp.src(paths.scripts_sw.src, {sourcemaps: false})
        .pipe(babel())
        .pipe(concat(paths.scripts_sw.saveas))
        //.pipe(uglify())
        .pipe(gulp.dest(paths.scripts_sw.dest));
}

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean_build = clean_build;
exports.copy_assets = copy_assets;
exports.styles_app = styles_app;
exports.scripts_sw = scripts_sw;
exports.scripts_app = scripts_app;


gulp.task('clean_build', function () {
    return clean_build();
});
gulp.task('copy_assets', function () {
    return copy_assets();
});
gulp.task('styles_app', function () {
    return styles_app();
});
gulp.task('scripts_app', function () {
    return scripts_app();
});
gulp.task('scripts_sw', function () {
    return scripts_sw();
});

/*
* Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
*/
gulp.task('watch', ['browserSync'], function () {
    // return watch();
    gulp.watch(paths.styles_app.src, styles_app, browserSync.reload);
    gulp.watch(paths.scripts_app.src, scripts_app, browserSync.reload);
    gulp.watch(paths.scripts_sw.src, scripts_sw, browserSync.reload);

    return true;
});

/*
* Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
*/
gulp.task('serve', ['browserSync'], function () {
    return true;
});

// https://css-tricks.com/gulp-for-beginners/
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'public'
        },
    })
});

/*
 * Define default task that can be called by just running `gulp` from cli
 */
// gulp.task('default', build);
gulp.task('default', (function () {
    runSequence(
        'clean_build',
        'copy_assets',
        ['styles_app', 'scripts_app', 'scripts_sw'],
    );
}));
