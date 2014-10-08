/*jslint node: true */
'use strict';

module.exports = function (C) {
    describe('API Validator tests reports by ' + C.planName, function () {
        var I,
            assert = require('assert');

        if (C.results) {
            for (I in C.results) {
                 it('[Saved in ' + C.savedFiles[I] + '] ' + C.results[I].input.url + ' should pass schema "' + C.results[I].input.schema + '"', function () {
                     if (C.validates[C.savedFiles[I]]) {
                        assert(false, JSON.stringify(C.validates[C.savedFiles[I]]));
                     }
                 });
            }
        } else {
            it('should executes all steps', function () {
                assert.fail(JSON.stringify(C.error));
            });
        }
    });
};
