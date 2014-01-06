var util = require('./test'),
	gutenberg = require('../bin/gutenberg'),
	should = require('should'),
	path = require('path');

describe('api integration', function() {
	describe('catalogueGetRecords', function() {

		beforeEach(function(done) {
			done();
		});


		it('Validate download Catalogue - limit 100', function(done) {
			this.timeout(999999);
			var instance = new gutenberg({
				rdfFile: path.join(__dirname, "gutenberg.rdf.zip")
			});
			var recordsEncoutered = 0;
			var filesToDownload = 100;
			instance.downloadCatalogue({
					limit: filesToDownload
				},
				function(record, file) {
					recordsEncoutered++;
					should.exist(file);
				},
				function(err, resp) {
					if (err)
						done(err);
					recordsEncoutered.should.equal(filesToDownload);
					return done();
				});
		});


		it('Validate download integrity', function(done) {
			this.timeout(999999);
			var instance = new gutenberg({
				rdfFile: path.join(__dirname, "gutenberg.rdf.zip")
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