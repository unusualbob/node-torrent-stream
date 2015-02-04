/* Created by Rob Riddle 2015 */

var inherits  = require('util').inherits;
var Transform = require('stream').Transform;
var crypto    = require('crypto');
var bencode   = require('bncode');

function TorrentStream(options) {
  Transform.call(this);

  //metadata
  this.pieceLength = options.pieceLength || 262144;

  this.announce = options.announce;
  this.createdBy = options.createdBy;

  this.info = {
    name: options.name,
    pieces: new Buffer(0),
    length: 0,
    "piece length": options.pieceLength
  };

  if (options.private) {
    this.info.private = 1;
  }

  this.buffer = new Buffer(0);
}

inherits(TorrentStream, Transform);

TorrentStream.prototype._transform = function(data, enc, done) {
  var self = this;
  this.info.length += data.length;
  this.buffer = Buffer.concat([this.buffer, data]);

  if (self.buffer.length < self.pieceLength) {
    return done();
  }

  while(this.buffer.length > self.pieceLength) {
    self._processPiece(self.pieceLength);
  }

  return done();
};

TorrentStream.prototype._flush = function(done) {
  var self = this;
  self._processPiece(self.buffer.length);

  var metadata = {
    announce: self.announce,
    "creation date": parseInt(Date.now() / 1000),
    info: self.info
  };

  if (self.createdBy) {
    metadata["created by"] = self.createdBy;
  }

  var data = bencode.encode(metadata);
  self.push(data);
  done();
};

TorrentStream.prototype._processPiece = function processPiece(length) {
  var self = this;
  var piece = self.buffer.slice(0, length);
  var pieceHash = new Buffer(crypto.createHash('sha1').update(piece).digest(), 'binary');

  self.buffer = self.buffer.slice(length);
  self.info.pieces = Buffer.concat([self.info.pieces, pieceHash]);
};

module.exports = TorrentStream;
