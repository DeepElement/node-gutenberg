var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    temp = require("temp").track(),
    Download = require('download'),
    tar = require('tar-stream'),
    parseString = require('xml2js').parseString,
    util = require('util'),
    ftp = require('jsftp');

// Constructor
var gutenberg = function(options) {
    this.options = options || {};
    this._ftpClient = new ftp({
        host: 'mirrors.xmission.com',
        debugMode: true,
        port: 21
    });
    this._catalogueAddress = this.options.catalogue || 'http://gutenberg.readingroo.ms/cache/generated/feeds/rdf-files.tar.zip';
    this._masterCataloguePath = null;
};

gutenberg.prototype.getCatalogueMetadata = function(data, callback) {
    var self = this;
    var results = [];
    var maxImported = data.maxImported || 99999;

    this._hydrateCatalogue({}, function(err, catalogueFilePath) {
        if (err)
            return callback(err);

        var extract = tar.extract();
        extract.on('entry', function(header, stream, extractCallback) {
            if (results.length >= maxImported) {
                extract.destroy();
                return;
            }

            var content = "";
            stream.on("data", function(d) {
                content += d.toString();
            });

            stream.on('end', function() {
                if (results.length < maxImported) {
                    gutenberg.prototype._parseRecord(content,
                        function(err, resp) {
                            if (err) {
                                return extractCallback(err);
                            }
                            if (resp.title && resp.formats.length > 0)
                                results.push(resp);
                            return extractCallback();
                        });
                } else
                    return extractCallback();
            });

            stream.resume();
        });

        extract.on('close', function(err) {
            return callback(null, results);
        });

        extract.on('error', function(err) {
            return callback(err);
        });

        extract.on('finish', function(err) {
            return callback(err, results);
        });

        fs.createReadStream(catalogueFilePath).pipe(extract);
    });
};

gutenberg.prototype.getCatalogueMetadataById = function(id, callback) {
    var self = this;
    var results = [];
    var result = null;

    this._hydrateCatalogue({}, function(err, catalogueFilePath) {
        if (err)
            return callback(err);

        var extract = tar.extract();
        extract.on('entry', function(header, stream, extractCallback) {
            if (result) {
                extract.destroy();
                return;
            }

            var content = "";
            stream.on("data", function(d) {
                content += d.toString();
            });

            stream.on('end', function() {
                if (!result) {
                    gutenberg.prototype._parseRecord(content,
                        function(err, resp) {
                            if (err) {
                                return extractCallback(err);
                            }
                            if (resp.id == id)
                                result = resp;
                            return extractCallback();
                        });
                } else
                    return extractCallback();
            });

            stream.resume();
        });

        extract.on('close', function(err) {
            return callback(null, result);
        });

        extract.on('error', function(err) {
            return callback(err);
        });

        extract.on('finish', function(err) {
            return callback(err, result);
        });

        fs.createReadStream(catalogueFilePath).pipe(extract);
    });
};


gutenberg.prototype._parseRecord = function(record, callback) {
    var response = {
        id: null,
        formats: [],
        downloads: 0,
        languages: [],
        title: null,
        author: null,
        isTextAvailable: false,
        issued: null
    };

    parseString(record, function(err, jsonRecord) {
        if (err)
            return callback(err);

        try {
            response.id = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['$']['rdf:about'].replace('ebooks/', '');
            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:language'][0]) {
                if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:language'][0]['rdf:Description']) {
                    response.languages.push(jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:language'][0]['rdf:Description'][0]['rdf:value'][0]["_"]);
                } else {
                    response.languages.push(jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:language'][0]["_"]);
                }
            }
            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['pgterms:downloads']) {
                if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['pgterms:downloads'][0]["rdf:value"]) {
                    response.downloads = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['pgterms:downloads'][0]["rdf:value"][0]["_"];
                } else {
                    response.downloads = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['pgterms:downloads'][0]["_"];
                }
            }

            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:title']) {
                response.title = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:title'];
            }


            var creatorNode = null;

            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:creator']) {
                creatorNode = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:creator'];
            } else {
                var creatorParent = jsonRecord['rdf:RDF']['pgterms:ebook'][0];
                var marcrelKeys = [];
                for (var key in creatorParent) {
                    if (key.indexOf('marcrel:') > -1) {
                        marcrelKeys.push(key);
                    }
                }
                if (marcrelKeys.length > 0) {
                    creatorNode = jsonRecord['rdf:RDF']['pgterms:ebook'][0][marcrelKeys[0]];
                }
            }

            if (creatorNode) {
                response.author = creatorNode[0]['pgterms:agent'][0]['pgterms:name'][0];
            } else {
                response.author = 'Unknown';
            }

            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:issued']) {
                response.issued = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:issued'][0]['_'];
            }

            if (jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:hasFormat']) {
                var files = jsonRecord['rdf:RDF']['pgterms:ebook'][0]['dcterms:hasFormat'];
                for (var i = 0; i <= files.length - 1; i++) {
                    var file = files[i];
                    var format = file['pgterms:file'][0]['dcterms:format'][0]['rdf:Description'][0]['rdf:value'][0]['_'];
                    var tempFilePath = file['pgterms:file'][0]['$']['rdf:about'];
                    var fileName = file['pgterms:file'][0]["$"]["rdf:about"].replace('http://www.gutenberg.org/ebooks/', '').replace('http://www.gutenberg.org/files/', '');

                    var outputContainer = {
                        format: format,
                        fileName: fileName,
                        extension: fileName.substr(fileName.lastIndexOf('.') + 1)
                    };

                    if (tempFilePath.indexOf('http://www.gutenberg.org/dirs') > -1)
                        outputContainer.specialPath = tempFilePath.replace('http://www.gutenberg.org/dirs', '');

                    response.formats.push(outputContainer);
                }
            }
            return callback(null, response);
        } catch (ex) {;
            return callback(ex, response);
        }
    });
};

gutenberg.prototype._hydrateCatalogue = function(data, callback) {
    var self = this;
    if (!self._masterCataloguePath) {
        temp.mkdir('gutenberg', function(err, dirPath) {
            if (err)
                return callback(new Error(err));

            var download = new Download()
                .get(self._catalogueAddress, dirPath, {
                    extract: true,
                    strip: 1
                });
            download.run(function(err, files, stream) {
                if (err)
                    return callback(new Error(err));
                self._masterCataloguePath = path.join(dirPath, 'rdf-files.tar');
                return callback(null, self._masterCataloguePath);
            });
        });
    } else
        return callback(null, self._masterCataloguePath);
};


gutenberg.prototype.getCatalogueItemByKey = function(data, callback) {
    var id = data.id;
    var extension = data.extension;
    var _self = this;
    _self.getCatalogueMetadataById(id,
        function(err, item) {
            if (err)
                return callback(err);
            var formatList = item.formats.filter(function(f) {
                if (f.extension == extension)
                    return true;
                return false;
            });

            if (formatList.length > 0) {
                var formatFile = formatList[0];
                var documentRoot = 'gutenberg/';

                var contentFile;
                if (formatFile.specialPath) {
                    contentFile = path.join(documentRoot, formatFile.specialPath);

                } else {
                    if (id.length > 0) {
                        documentRoot = path.join(documentRoot, id[0]);
                    }
                    if (id.length > 1) {
                        documentRoot = path.join(documentRoot, id[1]);
                    }

                    if (id.length > 2) {
                        documentRoot = path.join(documentRoot, id[2]);
                    }

                    if (id.length > 3) {
                        documentRoot = path.join(documentRoot, id[3]);
                    }

                    contentFile = path.join(documentRoot, id, id + "." + formatFile.extension);
                }

                if (contentFile) {
                    var content = "";

                    console.log(contentFile);
                    _self._ftpClient.get(contentFile, function(err, socket) {
                        if (err) {
                            console.log({
                                err: err,
                                file: contentFile
                            });
                            return callback(err);
                        }

                        socket.on("data", function(d) {
                            content += d.toString();
                        });
                        socket.on("close", function(err) {
                            if (err)
                                return callback(err);
                            gutenberg.prototype._ContentParseRecord(
                                content, callback);
                        });
                        socket.resume();
                    });
                } else
                    return callback('format-not-found');

            } else
                return callback('format-not-found');
        });
};

gutenberg.prototype._ContentParseRecord = function(content, callback) {
    var indexOfHeaderStart = content.indexOf("*** START OF");
    var indexOfHeaderEnd = content.indexOf('\n', indexOfHeaderStart);
    var header = content.substr(0, indexOfHeaderEnd);
    var indexOfFooterStart = content.indexOf("*** END OF");
    var footer = content.substr(indexOfFooterStart, content.length);
    var cleanContent = content.substr(indexOfHeaderEnd, indexOfFooterStart - indexOfHeaderEnd);

    var result = {
        header: header,
        footer: footer,
        content: cleanContent
    };

    var result = {
        header: header,
        footer: footer,
        content: cleanContent
    };
    return callback(null, result);
};

// export the class
if (typeof exports === 'object') {
    module.exports = gutenberg;
} else if (typeof define === 'function' && define.amd) {
    define(function() {
        return gutenberg;
    });
} else {
    this.gutenberg = gutenberg;
};
