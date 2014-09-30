module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            files: ['src/api-validator.js'],
            tasks: ['shell:buildCJS']
        },
        shell: {
            makeMojitoShaker: {
                command: 'npm run-script build_cjs',
                options: {
                    failOnError: true
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-watch');
    grunt.registerTask('default', ['transpile']);
};
