module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n;\n'
			},
			dist: {
				src: ['src/js/*.js', 'src/js/Services/*.js', 'src/js/Controllers/*.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd.mm.yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
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
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['dev']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('default', ['dev', 'watch']);
	grunt.registerTask('dev', ['jshint', 'concat']);
	grunt.registerTask('dist', ['jshint', 'concat', 'uglify']);
};