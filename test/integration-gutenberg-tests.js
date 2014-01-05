var util = require('./test'),
	gutenberg = require('../bin/gutenberg'),
	should = require('should');

describe('api integration', function() {
	describe('catalogueGetAllDownloadUrls', function() {

		beforeEach(function(done) {
			done();
		});

		it('Validate download integrity', function(done) {
			this.timeout(999999);
			gutenberg.catalogueGetAllDownloadUrls({
					format: 'txt'
				},
				function(err, resp) {
					if (err)
						done(err);

					should.exist(resp);
					done();
				});
		});
	});
});