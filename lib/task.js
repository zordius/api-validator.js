/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    request = require('./request'),
    save = require('./save'),
    schema = require('./schema'),
    validate = require('./validate'),
    yaml = require('yamljs'),

ATask = {
    run: function (F, cb) {
        ATask.reduce(F, [
            yaml.load,
            ATask.loadRequestList,
            ATask.request,
            ATask.save,
            ATask.validate,
            ATask.report
        ]);
    },
    validatePlan: function (C, next) {
        var E = validate.one({
            data: C,
            schemas: schema.loadRemoteCached(schema.coreBase),
            schema: 'core://default.api/plan#'
        });

        if (E === null) {
            next(C);
        } else {
            return E;
        }
    },
    reduce: function (D, tasks) {
        var task = tasks.shift();

        if (lodash.isFunction(task)) {
            task(D, function (R) {
                ATask.reduce(R, tasks);
            });
        }
    },
    loadRequestList: function (C, next) {
        yaml.load(C.requestYaml, function (D) {
            C.requests = D;
            next(C);
        });
    },
    request: function (C, next) {
        request.all(C.requests, function (D) {
            C.results = D;
            next(C);
        });
    },
    save: function (C, next) {
        var O = C.saveSpace ? C[C.saveSpace] : C;

        O.saveError = save.all(O.results, C);
        O.savedFiles = O.saveError._filenames;
        delete O.saveError._filenames;
        next(C);
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
