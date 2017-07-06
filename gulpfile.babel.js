import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserify from 'browserify';
import babelify from 'babelify';
import aliasify from 'aliasify';
import browserifyCSS from 'browserify-css';
import del from 'del';
import runSequence from 'run-sequence';
import path from 'path';
import source from 'vinyl-source-stream';
import buildext from 'buildext';

const $ = gulpLoadPlugins();

// Utils
function parsePathfile(pathfile) {
	return path.parse(pathfile);
}

function bundle(input, output) {
	input = parsePathfile(input);
	output = parsePathfile(output);

	const b = browserify({
		entries: [path.join(input.dir, input.base)],
		transform: [babelify, aliasify, browserifyCSS],
		fullPaths: true
	});

	return b.bundle()
		.pipe(source(output.base))
		.pipe(gulp.dest(output.dir));
}

// Clean
gulp.task('clean', (cb) => {
	del(['app/scripts/background_bundle.js', 'app/scripts/content_bundle.js', 'app/scripts/popup_bundle.js', 'app/scripts/options_bundle.js']);
	cb();
});


// Build
gulp.task('build', (cb) => {
	runSequence(['build:background', 'build:content', 'build:css', 'build:popup', 'build:options'], cb);
});

gulp.task('build:background', () => {
	return bundle('src/scripts/background.js', 'app/scripts/background_bundle.js');
});

gulp.task('build:content', () => {
	return bundle('src/scripts/content.js', 'app/scripts/content_bundle.js');
});

gulp.task('build:popup', () => {
	return bundle('src/scripts/popup.js', 'app/scripts/popup_bundle.js');
});

gulp.task('build:options', () => {
	return bundle('src/scripts/options.js', 'app/scripts/options_bundle.js');
});

gulp.task('build:css', () => {
	return gulp.src('src/styles/main.scss')
		.pipe($.sass({
			includePaths: ['src/styles']
		}).on('error', $.sass.logError))
		.pipe($.concat('main.css'))
		.pipe(gulp.dest('app/styles'));
});


// Watch
gulp.task('watch', ['build'], () => {
	$.livereload.listen();

	gulp.watch([
		'app/scripts/**/*.js',
		'app/images/**/*',
		'app/styles/**/*',
		'app/_locales/**/*.json'
	], $.batch({
		timeout: 500
	}, (event, cb) => {
		event.on('data', $.livereload.reload);
		cb();
	}));

	gulp.watch([
		'src/scripts/**/*.js',
		'src/styles/**/*.scss'
	], ['build']);
});


//Make
const buildConf = {
	src: path.join(__dirname,'app'),
	out: path.join(__dirname,'build'),
	config: path.join(__dirname,'buildext.json')
};
gulp.task('make', ['build'], (cb) => {
	runSequence(['make:chrome', 'make:firefox', 'make:edge', 'make:safari'], cb);
});

 gulp.task('make:chrome', () => {
	buildext.makeChrome(buildConf)
 });

 gulp.task('make:firefox', () => {
	 buildext.makeFirefox(buildConf)
 });

 gulp.task('make:edge', () => {
	 buildext.makeEdge(buildConf)
 });

 gulp.task('make:safari', () => {
	 buildext.makeSafari(buildConf)
 });

// Default
gulp.task('default', ['watch']);
