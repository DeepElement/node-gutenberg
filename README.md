node-gutenberg
==============
APIs for interacting with Project Gutenberg

[![Build Status](https://travis-ci.org/DeepElement/node-gutenberg.png?branch=master)](https://travis-ci.org/DeepElement/node-gutenberg)
#Setup

1. [rsync](http://ss64.com/bash/rsync.html) the Gutenberg catalogue to a local directory using the [Mirror instructions ](http://www.gutenberg.org/wiki/Gutenberg:Mirroring_How-To) provided by http://www.gutenberg.org/.
**Warning: this catalogue includes all file exports and is ~650gb**

2. (Optional), download the gutenberg catalogue metadata via [RDF (Current Format)](http://www.gutenberg.org/wiki/Gutenberg:Feeds) as provided by http://www.gutenberg.org. 

  _Note: module will fetch RDF live (~20s) if not provided on constructor configuration_

3. Instantiate the gutenberg module instance with options: 
```
  var gutenberg = require('gutenberg');

  var instance = new gutenberg({
      catalogDir : "../path/to/rsync/gutenberg/dir",
      rdfFile: "../path/to/gutenberg/rdf"
  );
  instance.catalogueGetRecords({},
				function(err, records) {
					if (err)
					  // handle error
					  
					 // process records
				});
```


#API
##Constructor
Because the gutenberg catalogue is massive and there exists a bandwidth cap (per IP) for downloads, this component does not attempt to fetch catalog content directly. Instead, it is recommended that you run a recurring job (CRON) that will incrementally rsync the catalogue to your runtime environment.

###Required
- catalogDir - the directory location for a synced gutenberg catalogue

###Optional
- rdfFile - the RDF metadata file which describes the gutenberg catalogue. If not resent, module will fetch.


##CatalogueGetRecords
Parse the rdfFile and process array of json records for each etext.

###Required
- options - configuration object; currently empty or null
- callback - function with arguments (error, results), where results is the record collection

#Contact & Issues
Issues: https://github.com/DeepElement/node-gutenberg/issues
CI: https://travis-ci.org/DeepElement/node-gutenberg

License

(The MIT License)

Copyright (c) 2008-2014 Todd Morrison <todd@deepelement.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
