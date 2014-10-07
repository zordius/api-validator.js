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
        var T = tasks.shift();

        if (lodash.isFunction(T)) {
            T(D, function (R) {
                ATask.run(R, tasks);
            });
        }
    },
    input: function (F, tasks) {
        yaml.load(F, function (D) {
            var R = D;
            lodash.map(tasks, function (C) {
                R = C(R);
            });
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
        lodash.map(C.results, function (R) {
        });
    }
};

module.exports = ATask;
