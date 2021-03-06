module.exports = function (grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.registerTask('default', 'watch');
	grunt.registerTask('dist', ['jshint', 'concat', 'html2js', 'uglify', 'copy', 'cssmin']);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd.mm.yyyy") %> */\n',
		src: {
			js: ['src/js/dt-download/*.js', 'src/js/dt-upload/*.js', 'src/js/dataTransfer/*.js'],
			html: ['src/js/**/*.tpl.html'],
			css: ['src/css/**/*.css']
		},
		dist: {
			js: ['dist/js'],
			css: ['dist/css']
		},
		concat: {
			options: {
				banner: '<%= banner %>',
				separator: '\n;\n'
			},
			dist: {
				src: '<%= src.js %>',
				dest: '<%= dist.js %>/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				files: {
					'<%= dist.js %>/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>'],
					'<%= dist.js %>/<%= pkg.name %>-templates.min.js': ['<%= html2js.dataTransfer.dest %>']
				}
			}
		},
		jshint: {
			files: '<%= src.js %>',
			options: {
				globals: {
					jQuery: true,
					console: true,
					module: true
				}
			}
		},
		copy: {
			all: {
				files: [
					{ dest: 'dist/libraries', src: '**', expand: true, cwd: 'libraries/' },
					{ dest: 'dist/settings.json', src: 'settings.json' }
				]
			}
		},
		html2js: {
			dataTransfer: {
				src: '<%= src.html %>',
				dest: '<%= dist.js %>/<%= pkg.name %>-templates.js'
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
			libs: {
				files: ['libraries/**', 'settings.json'],
				tasks: ['copy']
			},
			html: {
				files: '<%= src.html %>',
				tasks: ['html2js']
			},
			js: {
				files: '<%= src.js %>',
				tasks: ['jshint', 'concat']
			},
			css: {
				files: '<%= src.css %>',
				tasks: ['cssmin']
			}
		}
	});
};