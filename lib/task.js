/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    request = require('./request'),
    save = require('./save'),
    schema = require('./schema'),
    validate = require('./validate'),
    yaml = require('yamljs'),
    tasks = {
        standard: [
            'loadPlan',
            'validatePlan',
            'loadSchemas',
            'loadRequestList',
            'preValidateRequests',
            'prepareRequest',
            'validateRequests',
            'request',
            'save',
            'validate'
        ]
    },

ATask = {
    run: function (F, cb) {
        ATask.reduce(F, ATask.list().concat([cb]));
    },
    list: function (N) {
        return lodash.map(tasks[N || 'standard'], function (T) {
            ATask[T].taskname = T;
            return ATask[T];
        });
    },
    loadSchemas: function (C, next) {
        var I = 0;
        if (C.schemaDir) {
            lodash.map(schema.loadRelativeFile(C.schemaDir), function (S, N) {
                C.schemas[N] = S;
                I++;
            });
            if (C.verbose > 1) {
                console.warn(' ' + I + ' JSON schema loaded from ' + C.schemaDir);
            }
        } else {
            if (C.verbose > 1) {
                console.warn(' (No schemaDir in the plan)');
            }
        }

        C.selfVerify = validate.selfVerify(C.schemas);
        lodash.map(C.selfVerify, function () {
            C.abort = true;
        });

        next(C);
    },
    loadPlan: function (F, next) {
        yaml.load(F, function (D) {
            if (D) {
                D.schemas = schema.loadCoreSchemas();
                D.planName = F;
            } else {
                D = {
                    error: 'Can not load plan yaml file: "' + F + '"',
                    abort: true,
                    pass: false,
                    planName: F
                };
            }
            if (!D.requestConfig) {
                D.requestConfig = {};
            }
            if (!D.requestConfig.yqlConfig) {
                D.requestConfig.yqlConfig = {};
            }
            if (!D.requestConfig.yqlConfig.endpoint) {
                D.requestConfig.yqlConfig.endpoint  = 'https://query.yahooapis.com/v1/public/yql';
            }
            if (!D.requestConfig.yqlConfig.qs) {
                D.requestConfig.yqlConfig.qs = {};
            }
            D.requestConfig.yqlConfig.json = true;
            D.requestConfig.yqlConfig.qs.format = 'json';
            D.requestConfig.yqlConfig.qs.diagnostics = true;

            D.tasks = {};
            next(D);
        });
    },
    validatePlan: function (C, next) {
        var E = validate.one({
            data: C,
            schemas: C.schemas,
            schema: 'core://default.api/plan#'
        }, {useDefault: true});

        if (E) {
            C.error = E;
            C.abort = true;
        }

        next(C);
    },
    prepareRequest: function (C, next) {
        var helper = require(C.requestHelper);

        C.requests = lodash.map(C.requests, function (R) {
            return helper(R, C);
        });
        next(C);
    },
    validateRequestsTask: function (C, schema) {
        var E = validate.one({
            data: C.requests,
            schemas: C.schemas,
            schema: schema
        });

        if (E) {
            C.error = E;
            C.abort = true;
        }

        return C;
    },
    validateRequests: function (C, next) {
        next(ATask.validateRequestsTask(C, 'core://default.api/requests#/definitions/processed'));
    },
    preValidateRequests: function (C, next) {
        next(ATask.validateRequestsTask(C, 'core://default.api/requests#'));
    },
    reduce: function (D, tasks) {
        var task = tasks.shift();

        if (D.verbose) {
            process.stderr.write('.');
        }
        if (D.abort) {
            console.warn('Abort!');
            task = tasks.pop();
            lodash.map(tasks, function (F) {
                D.tasks[F.taskname] = false;
            });
            tasks = [];
        }
        if (lodash.isFunction(task)) {
            if (task.taskname) {
                if (D.tasks) {
                    D.tasks[task.taskname] = D.abort ? false : true;
                }
                if (D.verbose > 1) {
                    process.stderr.write('[Task] ' + task.taskname + ' .');
                }
            }
            task(D, function (R) {
                if (D.verbose > 1) {
                    console.warn('...done');
                }
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
            if (C.verbose > 1) {
                console.warn('All ' + C.requests.length + ' requests loaded.');
            }
            next(C);
        });
    },
    request: function (C, next) {
        request.all(C.requests, {
            concurrency: C.concurrency,
            verbose: C.verbose
        }, function (D) {
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
        C.pass = true;
        lodash.map(C.results, function (R, I) {
            var E = validate.one({
                data: R,
                schemas: C.schemas,
                schema: (R.body && R.body.schema) ? R.body.schema : R.input.schema
            });
            if (E) {
                C.validates[C.savedFiles[I]] = E;
                C.pass = false;
            }
        });
        next(C);
    }
};

module.exports = ATask;
