/*jslint node: true */
'use strict';

var assert = require('assert'),
    createSpec = function (C, I) {
        return function () {
            if (C.validates[C.savedFiles[I]]) {
                assert(false, JSON.stringify(C.validates[C.savedFiles[I]]));
            }
        }
    },
    createTask = function (C, I) {
        return function () {
            if (!C.tasks[I]) {
                assert(false, ' the task was skipped');
            }
        }
    };

module.exports = function (C) {
    describe('API Validator tests reports by ' + C.planName, function () {
        var I;

        if (C.tasks) {
            for (I in C.tasks) {
                 it('Task "' + I + '" should be executed', createTask(C, I));
            }
        }
        if (C.results) {
            for (I in C.results) {
                 it('[Saved in ' + C.savedFiles[I] + '] ' + C.results[I].input.url + ' should pass schema "' + C.results[I].input.schema + '"', createSpec(C, I));
            }
        } else {
            it('should executes all steps', function () {
                assert.fail(JSON.stringify(C.error));
            });
        }
    });
};
