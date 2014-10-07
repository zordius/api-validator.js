/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    request = require('./request'),
    save = require('./save'),
    schema = require('./schema'),
    validate = require('./validate'),
    when = require('when'),
    yaml = require('yamljs'),

ATask = {
    run: function (D, tasks) {
        var task = tasks.shift();

        if (lodash.isFunction(task)) {
            task(D, function (R) {
                ATask.run(R, tasks);
            });
        }
    },
    input: function (F, tasks) {
        yaml.load(F, function (D) {
        });
    },
    fetch: function (C, next) {
        request.all(C.requests, function (D) {
            C.results = D;
            C.saveError = save.all(D, C);
            C.savedFiles = C.saveError._filenames;
            delete C.saveError._filenames;
            next(C);
        });
    },
    validate: function (C, next) {
        C.validates = {};
        lodash.map(C.results, function (R, I) {
            var E = validate.one({
                data: R,
                schemas: C.schemas,
                schema: (R.body && R.body.schema) ? R.body.schema : R.input.schema
            });
            if (E) {
                C.validates[R.savedFiles[I]] = E;
            }
        });

        next(C);
    }
};

module.exports = ATask;
