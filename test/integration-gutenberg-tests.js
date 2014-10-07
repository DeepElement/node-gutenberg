var util = require('./test'),
    gutenberg = require('../bin/gutenberg'),
    should = require('should'),
    path = require('path'),
    async = require('async'),
    fs = require('fs');

describe('api integration', function() {
    describe('getCatalogueMetadata', function() {
        var instance;
        var sampleKeys = [];

        it('Standard Success', function(done) {
            this.timeout(999999);
            instance = new gutenberg();
            instance.getCatalogueMetadata({
                    maxImported: 11000
                },
                function(err, keysResp) {
                    if (err)
                        return done(err);
                    should.exist(keysResp);
                    keysResp.length.should.be.above(0);
                    keysResp.forEach(function(r) {
                        should.exist(r.id);
                        should.exist(r.formats);
                        should.exist(r.languages);
                        should.exist(r.title);
                        should.exist(r.author);
                        should.exist(r.downloads);
                        should.exist(r.issued);

                        r.formats.length.should.be.above(0);
                        r.languages.length.should.be.above(0);
                    });
                    return done();
                });
        });

        it('MaxImported Count', function(done) {
            this.timeout(999999);
            instance = new gutenberg();
            var maxImported = 5;
            instance.getCatalogueMetadata({
                    maxImported: maxImported
                },
                function(err, keysResp) {
                    if (err)
                        return done(err);
                    keysResp.length.should.equal(maxImported);
                    return done();
                });
        });
    });

    describe('getCatalogueMetadataById', function() {
        var instance;
        var sampleMetadata = [];

        beforeEach(function(done) {
            instance = new gutenberg();
            instance.getCatalogueMetadata({
                    maxImported: 5
                },
                function(err, keysResp) {
                    if (err)
                        return done(err);
                    sampleMetadata = keysResp;
                    return done();
                });
        });

        it('Standard Success', function(done) {
            this.timeout(999999);
            async.each(sampleMetadata,
                function(meta, metaCb) {
                    instance = new gutenberg();
                    instance.getCatalogueMetadataById(
                        meta.id,
                        function(err, r) {
                            if (err)
                                return done(err);

                            should.exist(r);
                            should.exist(r.id);
                            r.id.should.equal(meta.id);

                            return done();
                        });
                },
                done);
        });
    });

    describe('getCatalogueItemByKey', function() {
        var instance;
        var sampleMetadata = [];

        beforeEach(function(done) {
            instance = new gutenberg();
            instance.getCatalogueMetadata({
                    maxImported: 10
                },
                function(err, keysResp) {
                    if (err)
                        return done(err);
                    sampleMetadata = keysResp;
                    return done();
                });
        });

        it('Standard Success - Fixed - Above 10000', function(done) {
            this.timeout(999999);
            instance = new gutenberg();
            instance.getCatalogueItemByKey({
                    id: 10005,
                    extension: 'txt'
                },
                function(err, contentResp) {
                    if (err)
                        return done(err);

                    should.exist(contentResp.header);
                    should.exist(contentResp.footer);
                    should.exist(contentResp.content);

                    return done();
                });
        });

        it('Standard Success - Fixed - Below 10000', function(done) {
            this.timeout(999999);
            instance = new gutenberg();
            instance.getCatalogueItemByKey({
                    id: 9999,
                    extension: 'txt'
                },
                function(err, contentResp) {
                    if (err)
                        return done(err);

                    should.exist(contentResp.header);
                    should.exist(contentResp.footer);
                    should.exist(contentResp.content);

                    return done();
                });
        });

        it('Standard Success - Dynamic', function(done) {
            this.timeout(999999);

            async.eachSeries(sampleMetadata,
                function(meta, metaCb) {
                    instance.getCatalogueItemByKey({
                            id: meta.id,
                            extension: 'txt'
                        },
                        function(err, contentResp) {
                            if (err)
                                return metaCb(err);

                            should.exist(contentResp.header);
                            should.exist(contentResp.footer);
                            should.exist(contentResp.content);

                            return metaCb();
                        });
                },
                done);
        });
    });
});
