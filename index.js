/* Created by Rob Riddle 2015 */

var inherits  = require('util').inherits;
var Transform = require('stream').Transform;
var async     = require('async');
var crypto    = require('crypto');
var bencode   = require('bncode');

function TorrentStream(options) {
  Transform.call(this);

  //metadata
  this.pieceLength = options.pieceLength || 262144;

  this.announce = options.announce;
  this.trackers = options.trackers;
  this.createdBy = options.createdBy;

  if (!this.announce && this.trackers && this.trackers.length) {
    this.announce = this.trackers[0];
  }
  
  if (!this.announce){
    throw new Error('Torrent announce url is required');
  }

  if (!options.name) {
    throw new Error('Torrent name is required');
  }

  this.info = {
    name: options.name,
    pieces: new Buffer(0),
    length: 0,
    'piece length': this.pieceLength
  };

  if (options.private) {
    this.info.private = 1;
  }

  if (options.encoding) {
    this.encoding = options.encoding;
  }

  this.buffer = new Buffer(0);
}

inherits(TorrentStream, Transform);

TorrentStream.prototype._transform = function(data, enc, done) {
  var self = this;
  this.info.length += data.length;
  if (self.info.files) {
    self.info.files[self.info.files.length - 1].length += data.length;
  }
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
    'announce-list': self.trackers,
    'creation date': parseInt(Date.now() / 1000),
    info: self.info
  };

  if (self.createdBy) {
    metadata['created by'] = self.createdBy;
  }

  if (self.encoding) {
    metadata.encoding = self.encoding;
  }

  var data = bencode.encode(metadata);
  self.push(data);
  self.complete = true;
  done();
};

TorrentStream.prototype._processPiece = function processPiece(length) {
  var self = this;
  var piece = self.buffer.slice(0, length);
  var pieceHash = new Buffer(crypto.createHash('sha1').update(piece).digest(), 'binary');

  self.buffer = self.buffer.slice(length);
  self.info.pieces = Buffer.concat([self.info.pieces, pieceHash]);
};

//Allows adding a stream to the processing queue, used for multi-file torrents
TorrentStream.prototype.addFile = function addFile(stream, fileName) {
  if (!this.streams) {
    this.streams = [];
  }
  stream.pause();

  if (this.complete) {
    throw new Error('Torrent.addFile was called after stream was already finished');
  }

  this.streams.push({s: stream, name: fileName});

  if (!this.info.files) {
    this._start();
  }
};

TorrentStream.prototype._start = function start() {
  var self = this;
  if (!self.streams || self.streams.length === 0) {
    throw new Error('No streams to process');
  }

  self.info.files = [];

  async.eachSeries(self.streams, function(stream, callback) {
    self.info.files.push({
      path: [stream.name],
      length: 0
    });
    stream.s.pipe(self, {end: false});
    stream.s.on('end', function() {
      callback();
    });
    stream.s.resume();
  }, function (err) {
    self.end();
  });
};

module.exports = TorrentStream;
