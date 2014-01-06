var util = require('./test'),
	gutenberg = require('../bin/gutenberg'),
	should = require('should');

describe('api integration', function() {
	describe('catalogueGetRecords', function() {

		beforeEach(function(done) {
			done();
		});

		it('Validate download integrity', function(done) {
			this.timeout(999999);
			var instance = new gutenberg();
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