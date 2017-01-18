module.exports = function (grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		src: {
			js: ['src/js/**/*.js'],
			html: ['src/html/**/*.html'],
			css: ['src/css/**/*.css']
		},
		dist: {
			js: ['dist/js'],
			css: ['dist/css']
		},
		concat: {
			options: {
				separator: '\n;\n'
			},
			dist: {
				src: ['src/js/*.js', 'src/js/Services/*.js', 'src/js/Controllers/*.js'],
				dest: '<%= dist.js %>/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd.mm.yyyy") %> */\n'
			},
			dist: {
				files: {
					'<%= dist.js %>/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},
		jshint: {
			files: ['Gruntfile.js', 'src/js/**/*.js'],
			options: {
				globals: {
					jQuery: true,
					console: true,
					module: true
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'<%= dist.css %>/<%= pkg.name %>.css': ['<%= src.css %>']
				}
			}
		},
		watch: {
			js: {
				files: ['src/js/**/*.js'],
				tasks: ['jshint', 'concat']
			},
			css: {
				files: ['src/css/**/*.css'],
				tasks: ['cssmin']
			}
		}
	});
};