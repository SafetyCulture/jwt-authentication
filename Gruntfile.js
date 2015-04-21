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
                tasks: ['unitTest']
            },
            integration: {
                files: ['lib/**/*', 'test/integration/**/*'],
                tasks: ['integrationTest']
            }
        },
        changelog: {
            options: {
                commitLink: function(commitHash) {
                    var shortCommitHash = commitHash.substring(0, 8);
                    var commitUrl = grunt.config.get('pkg.repository.url') + '/commits/' + commitHash;
                    return '[' + shortCommitHash + '](' + commitUrl + ')';
                },
                issueLink: function(issueId) {
                    var issueUrl = grunt.config.get('pkg.repository.url') + '/issue/' + issueId;
                    return '[' + issueId + '](' + issueUrl + ')';
                },
                file: 'docs/CHANGELOG.md'
            }
        },
        bump: {
            options: {
                commit: true,
                commitMessage: 'chore: Release v%VERSION%',
                commitFiles: ['package.json', 'docs/CHANGELOG.md', 'docs/API.md'],
                pushTo: 'origin',
                updateConfigs: ['pkg'],
                tagName: '%VERSION%'
            }
        },
        jsdoc2md: {
            api: {
                src: "lib/*.js",
                dest: "docs/API.md"
            }
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-npm');
    grunt.loadNpmTasks("grunt-jsdoc-to-markdown");

    grunt.renameTask('watch', 'grunt-contrib-watch');

    grunt.registerTask('unitTest', ['jasmine_node:unit']);
    grunt.registerTask('integrationTest', ['connect:server', 'jasmine_node:integration']);
    grunt.registerTask('buildAndTest', ['jshint:source', 'unitTest', 'integrationTest']);
    grunt.registerTask('docs', ['changelog', 'jsdoc2md']);
    grunt.registerTask('release', function(type) {
        if (!type) {
            grunt.fail.fatal('No release type specified. You must specify patch, minor or major. For example "grunt release:patch".');
        }
        grunt.task.run(['buildAndTest', 'bump-only:' + type, 'docs', 'bump-commit', 'npm-publish']);
    });

    grunt.registerTask('default', ['buildAndTest']);
    grunt.registerTask('watch', ['grunt-contrib-watch:unit']);
    grunt.registerTask('watchIntegrationTest', ['grunt-contrib-watch:integration']);
};