module.exports = function (grunt) {
    grunt.initConfig({
        transpile: {
            main: {
                type: 'cjs',
                expand: true,
                files: [
                    src: ['src/*.js'],
                    dest: '.'
                ]
            } 
        }
    });

    grunt.loadNpmTasks('grunt-es6-module-transpiler');
    grunt.registerTask('build', ['clean', 'transpile']);
};
