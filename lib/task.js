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
            ATask.loadPlan,
            ATask.validatePlan,
            ATask.loadSchemas,
            ATask.loadRequestList,
            ATask.validateRequests,
            ATask.request,
            ATask.save,
            ATask.validate,
            cb
        ]);
    },
    loadSchemas: function (C, next) {
        if (C.schemaDir) {
            lodash.map(schema.loadRelativeFile(C), function (S, N) {
                C.schemas[N] = S;
            });
        }
        C.selfVerify = validate.selfVerify(C.schemas);

        next(C);
    },
    loadPlan: function (F, next) {
        yaml.load(F, function (D) {
            if (D) {
                D.schemas = schema.loadCoreSchemas();
                next(D);
            } else {
                next({
                    error: 'Can not load plan yaml file: "' + F + '"',
                    abort: true,
                    plan: F
                });
            }
        });
    },
    validatePlan: function (C, next) {
        var E = validate.one({
            data: C,
            schemas: C.schemas,
            schema: 'core://default.api/plan#'
        });

        if (E) {
            C.error = E;
            C.abort = true;
        }

        next(C);
    },
    validateRequests: function (C, next) {
        var E = validate.one({
            data: C.requests,
            schemas: C.schemas,
            schema: 'core://default.api/requests#'
        });

        if (E) {
            C.error = E;
            C.abort = true;
        }

        next(C);
    },
    reduce: function (D, tasks) {
        var task = tasks.shift();

        if (lodash.isFunction(task)) {
            if (D.verbose) {
                console.log('.');
            }
            if (D.abort) {
                tasks = [tasks.pop()];
            }
            task(D, function (R) {
                ATask.reduce(R, tasks);
            });
        }
    },
    loadRequestList: function (C, next) {
        yaml.load(C.requestYaml, function (D) {
            C.requests = [];
            lodash.map(D, function (R) {
                var RR;
                if (C.requestConfig) {
                    RR = lodash.cloneDeep(C.requestConfig);
                    lodash.map(R, function (V, K) {
                        RR[K] = V;
                    });
                    C.requests.push(RR);
                } else {
                    C.requests.push(R);
                }
            });
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
                C.validates[C.savedFiles[I]] = E;
            }
        });
        next(C);
    }
};

module.exports = ATask;
