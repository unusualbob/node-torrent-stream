/* Created by Rob Riddle 2015 */

var inherits  = require('util').inherits;
var Transform = require('stream').Transform;
var crypto    = require('crypto');
var bencode   = require('bncode');

function TorrentStream(info) {
  Transform.call(this);

  //metadata
  this.pieceLength = info.pieceLength || 262144;
  this.announce = info.announce;
  this.name = info.name;
  this.pieces = new Buffer(0);
  this.length = 0;

  this.buffer = new Buffer(0);
}

inherits(TorrentStream, Transform);

TorrentStream.prototype._transform = function(data, enc, done) {
  var self = this;
  this.length += data.length;
  this.buffer = Buffer.concat([this.buffer, data]);

  if (self.buffer.byteLength || 0 < self.pieceLength) {
    return done();
  }

  while(this.buffer.length > self.pieceLength) {
    self._processPiece(self.pieceLength);
  }
};

TorrentStream.prototype._flush = function(done) {
  var self = this;
  self._processPiece(self.buffer.byteLength);

  var metadata = {
    announce: self.announce,
    info: {
      name: self.name,
      "piece length": self.pieceLength,
      length: self.length,
      pieces: self.pieces
    }
  };

  var data = bencode.encode(metadata);
  self.push(data);
  done();
};

module.exports = TorrentStream;

TorrentStream.prototype._processPiece = function processPiece(length) {
  var self = this;
  var piece = self.buffer.slice(0, length);
  var pieceHash = new Buffer(crypto.createHash('sha1').update(piece).digest(), 'binary');

  self.buffer = self.buffer.slice(length);
  self.pieces = Buffer.concat([self.pieces, pieceHash]);
};