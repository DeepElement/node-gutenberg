Gutenberg for NodeJs
==============
An API for interacting with the Gutenberg Project

 [![npm status](https://nodei.co/npm/gutenberg.png?compact=true)](https://nodei.co/npm/gutenberg.png?compact=true)
 
[![Build Status](https://travis-ci.org/DeepElement/node-gutenberg.png?branch=master)](https://travis-ci.org/DeepElement/node-gutenberg) 

#Usage

NodeJS module to serve as facade to the Gutenberg Catalogue. 

The Module supports:

- Fetch of Catalogue Index Metadata (via HTTP RDF fetch) 
- Content Download by Format (via FTP)
	- Added support for pre-10000 catalogue indexes 
- Parsing of Ascii-Text document areas

All interactions are Live over HTTP/FTP and consumers are responsible for intelligent usage/caching.

Create an instance:

```javascript
var Gutenberg = require('gutenberg');
var instance = new Gutenberg();
```

Get Catalogue Metadata:

```javascript
instance.getCatalogueMetadata(	{},
	function(err, metas){
		// for each meta, you get catalogue metadata by doc
	}
);
```

Get Catalogue Item by Key:

```javascript
instance.getCatalogueItemByKey(	{
		id: 9999,
		extension: 'txt'	// see catalogue metadata for list of supported extension by doc
	},
	function(err, content){
		// Content has header, footer and content fields
	}
);
```


#Contact & Issues
Issues: [Github Issues](https://github.com/DeepElement/node-gutenberg/issues
)

CI: [travic-ci.org](https://travis-ci.org/DeepElement/node-gutenberg
)

#License

(The MIT License)

Copyright (c) 2008-2014 Todd Morrison <todd@deepelement.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
