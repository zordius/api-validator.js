/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    request = require('./request'),
    save = require('./save'),
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

    fetch: function (L, opts) {
        request.all(L, function (D) {
            opts.callback(save.all(D, opts));
        });
    }
};

module.exports = ATask;
