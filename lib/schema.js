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
    coreBase: path.resolve(__dirname, '../schemas'),
    coreSchemaMatch: /(schema)?\.json$/,
    find: function (base, match) {
        var F = [],
            D = base || process.cwd();

        try {
            fs.readdirSync(D).forEach(function (N) {
                var FN = D + '/' + N,
                    S = fs.statSync(FN);

                if (S.isDirectory()) {
                    lodash.map(ASchema.find(FN), function (O) {
                        F.push(O);
                    });
                    return;
                }

                if (N.match(match || ASchema.coreSchemaMatch)) {
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
            H[F] = JSON.parse(fs.readFileSync(F, 'utf8'));
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
        var R = ASchema.loadRemoteCached(ASchema.coreBase + '/remote');
        return lodash.map(ASchema.loadRemoteCached(ASchema.coreBase + '/schema'), function (S, N) {
            R[N] = S;
        });
        return R;
    },
    remoteFixer: function (O) {
        O.name = O.schema.id;

        return O;
    },
    relativeFileFixer: function (O) {
        var keepID = (O.options && O.options.keepID) ? O.options.keepID : false,
            FN = path.resolve(O.name),
            URI = 'file://' + FN,
            ID = (keepID && O.schema.id) ? O.schema.id : URI;

        O.name = ID;
        O.schema.id = ID;
        O.schema = ASchema.deepResolveFileRef(O.schema, path.dirname(ID.replace(/file:\/\//, '')));

        return O;
    }
};

module.exports = ASchema;
