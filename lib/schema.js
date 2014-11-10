/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    traverse = require('traverse'),
    fs = require('fs'),
    path = require('path'),
    jsonlint = require('jsonlint'),

ASchema = {
    coreURL: 'http://uschema.github.io/json/apivalidator.',
    coreBase: path.resolve(__dirname, '../schemas'),
    coreSchemaMatch: /(schema)?\.json$/,
    find: function (base, match) {
        var F = [],
            D = base || process.cwd(),
            M = match || ASchema.coreSchemaMatch;

        try {
            fs.readdirSync(D).forEach(function (N) {
                var FN = D + '/' + N,
                    S = fs.statSync(FN);

                if (S.isDirectory()) {
                    lodash.map(ASchema.find(FN, M), function (O) {
                        F.push(O);
                    });
                    return;
                }

                if (N.match(M)) {
                    F.push(FN);
                }
            });
        } catch (E) {
        }

        return F;
    },
    load: function (FS) {
        var H = {};

        lodash.map(FS, function (F) {
            try {
                H[F] = jsonlint.parse(fs.readFileSync(F, 'utf8'));
            } catch (E) {
                throw new Error('JSON file "' + F + '" error: ' + E.message);
            }
        });

        return H;
    },
    resolveFileRef: function (U, base) {
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
    deepResolveFileRef: function (O, base, resolver) {
        var usedResolver = lodash.isFunction(resolver) ? resolver : ASchema.resolveFileRef;
        traverse(O).forEach(function (V) {
            if (this.key === '$ref') {
                this.update(usedResolver(V, base));
            }
        });
        return O;
    },
    loadResolveRef: function (base, match, fixer, opts) {
        var R = {};
        lodash.map(ASchema.load(ASchema.find(base, match)), function (S, F) {
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
    loadRemoteCached: function (base, match, opts) {
        return ASchema.loadResolveRef(base, match, ASchema.remoteFixer, opts);
    },
    loadRelativeFile: function (base, match, opts) {
        return ASchema.loadResolveRef(base, match, ASchema.relativeFileFixer, opts);
    },
    loadCoreSchemas: function () {
        return ASchema.loadRemoteCached(ASchema.coreBase);
    },
    remoteFixer: function (O) {
        O.name = O.schema.id;

        return O;
    },
    relativeFileFixer: function (O) {
        var FN = path.resolve(O.name),
            URI = 'file://' + FN,
            ID = (O.schema.id && O.schema.id.match(/:\/\//)) ? O.schema.id : URI;

        O.name = ID;
        O.schema.id = ID;
        O.schema = ASchema.deepResolveFileRef(O.schema, path.dirname(ID.replace(/file:\/\//, '')));

        return O;
    }
};

module.exports = ASchema;
