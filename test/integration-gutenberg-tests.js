var util = require('./test'),
	gutenberg = require('../bin/gutenberg'),
	should = require('should'),
	path = require('path'),
	async = require('async');

describe('api integration', function() {
	describe('getCatalogueItemByKey', function() {

		var instance;
		var sampleIds = ['etext10001', 'etext10002', 'etext10003', 'etext10004', 'etext10005', 'etext10006', 'etext10007', 'etext10008', 'etext10009'];
		var sampleRecords;

		beforeEach(function(done) {
			instance = new gutenberg({
				catalogDir: path.join(__dirname, "/samples/catalog"),
				rdfZipFile: path.join(__dirname, "/samples/gutenberg.rdf.zip")
			});

			instance.catalogueGetRecords({},
				function(err, resp) {
					if (err)
						done(err);

					sampleRecords = resp.filter(function(r) {
						if (sampleIds.indexOf(r.id) > -1)
							return true;
						return false;
					});
					done();
				});
		});

		it('Validate catalogue fetch', function(done) {
			async.eachSeries(sampleRecords,
				function(item, item_callback) {
					instance.getCatalogueItemByKey(
						item.id,
						function(err, data) {
							should.not.exist(err);
							should.exist(data);
							item_callback(err);
						});
				},
				function(err) {
					done(err);
				});
		});
	});

	describe('catalogueGetRecords', function() {
		it('Validate download integrity', function(done) {
			this.timeout(999999);
			var instance = new gutenberg({
				catalogDir: path.join(__dirname, "/samples/catalog"),
				rdfZipFile: path.join(__dirname, "/samples/gutenberg.rdf.zip")
			});
			instance.catalogueGetRecords({},
				function(err, resp) {
					if (err)
						done(err);

					should.exist(resp);
					resp.length.should.be.above(30000);
					done();
				});
		});
	});
});