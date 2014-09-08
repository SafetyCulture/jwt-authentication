module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine_node: {
      unit: ['test/unit'],
      integration: ['test/integration']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      source: {
        files: {
          src: ['lib/**/*.js', 'test/**/*.js']
        }
      }
    },
    connect: {
      server: {
        options: {
          base: 'test/integration/key-server'
        }
      }
    },
    'grunt-contrib-watch': {
      options: {
        atBegin: true
      },
      unit: {
        files: ['lib/**/*', 'test/unit/**/*'],
        tasks: ['unittest']
      },
      integration: {
        files: ['lib/**/*', 'test/integration/**/*'],
        tasks: ['integrationtest']
      }
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.renameTask('watch', 'grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['jshint:source', 'unittest', 'integrationtest']);

  grunt.registerTask('unittest', ['jasmine_node:unit']);
  grunt.registerTask('integrationtest', ['connect:server', 'jasmine_node:integration']);
  grunt.registerTask('watch', ['grunt-contrib-watch:unit']);
  grunt.registerTask('watchIntegrationTest', ['grunt-contrib-watch:integration']);
};