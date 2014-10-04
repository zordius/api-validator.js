/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when'),
    traverse = require('traverse'),
    fs = require('fs'),
    path = require('path'),

ASchema = {
    findSchemaFiles: function (base, match) {
        var F = [],
            D = base || process.cwd();

        try {
            fs.readdirSync(D).forEach(function (N) {
                var FN = D + '/' + N,
                    S = fs.statSync(FN);

                if (S.isDirectory()) {
                    lodash.map(ASchema.findSchemaFiles(FN), function (O) {
                        F.push(O);
                    });
                    return;
                }

                if (N.match(match || /(schema)?\.json$/)) {
                    F.push(FN);
                }
            });
        } catch (E) {
        }

        return F;
    },
    loadSchemaFiles: function (FS) {
        var H = {};

        lodash.map(FS, function (F) {
            H[F] = JSON.parse(fs.readFileSync(F, 'utf8'));
        });

        return H;
    },
    resolveFilePath: function (U, base) {
        var M;
        try {
            M = U.match(/^file:\/\/(.+)(#.*)?/);
            if (M) {
                return 'file://' + path.resolve(base, M[1]) + (M[2] || '');
            }
        } catch (E) {
            // Do nothing ...
        }
        return U;
    },
    resolveAllRelativePath: function (O, base, resolver) {
        var usedResolver = lodash.isFunction(resolver) ? resolver : ASchema.resolveFilePath;
        traverse(O).forEach(function (V) {
            if (this.key === '$ref') {
                this.update(usedResolver(V, base));
            }
        });
        return O;
    },
    loadFixedSchemaFiles: function (base, match, fixer, opts) {
        var R = {};
        lodash.map(ASchema.loadSchemaFiles(ASchema.findSchemaFiles(base, match)), function (S, F) {
            var O = fixer({
                name: F,
                schema: S,
                base: base,
                options: opts
            });
            R[O.name] = O.schema;
        });
        return R;
    },
    loadRemoteCachedSchemaFiles: function (base, match, opts) {
        return ASchema.loadFixedSchemaFiles(base, match, ASchema.remoteFixer, opts);
    },
    loadRelativeSchemaFiles: function (base, match, opts) {
        return ASchema.loadFixedSchemaFiles(base, match, ASchema.relativeFileSchemaFixer, opts);
    },
    remoteFixer: function (O) {
        O.name = O.schema.id;

        return O;
    },
    relativeFileSchemaFixer: function (O) {
        var keepID = (O.options && O.options.keepID) ? O.options.keepID : false,
            FN = path.resolve(O.name),
            URI = 'file://' + FN,
            ID = (keepID && O.schema.id) ? O.schema.id : URI;

        O.name = ID;
        O.schema.id = ID;
        O.schema = ASchema.resolveAllRelativePath(O.schema, path.dirname(ID.replace(/file:\/\//, '')));

        return O;
    }
};

module.exports = ASchema;
