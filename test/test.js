/**
 * Created by robriddle on 2/24/15.
 */
var fs = require("fs");
var Writable = require("stream").Writable;
var util = require("util");
var Torrent = require("../index.js");
var bencode = require("bncode");
var should = require("chai").should();

/* Writable memory stream */
function MemoryStream() {
  Writable.call(this);
  this.memStore = new Buffer(0);
}
util.inherits(MemoryStream, Writable);

MemoryStream.prototype._write = function (chunk, enc, cb) {
  var self = this;
  self.memStore = Buffer.concat([self.memStore, chunk]);
  cb();
};

MemoryStream.prototype.getData = function() {
  return this.memStore;
};
/* End memory store */

//Warn windows users about auto-CRLF if one or more tests fail
process.on("exit", function(code) {
  if (process.platform === "win32" && code !== 0) {
    console.log("=======================================");
    console.log("\033[91mWINDOWS USERS:\033[0m");
    console.log("If all tests fail due to length or hash");
    console.log("you are probably using auto-CRLF in git.");
    console.log("Convert the 'testData.txt' file to LF");
    console.log("=======================================\n");
  }
});

describe("Torrent-Stream", function() {
  describe("single-file", function() {
    it("should create a torrent from a single stream with only announce and name", function (done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData"
      });
      var ws = new MemoryStream();
      rs.pipe(ts);
      ts.pipe(ws);

      ws.on("finish", function () {
        var data = ws.getData();
        var decodedData = bencode.decode(data);

        decodedData.announce.toString().should.equal("http://totally_a_real_tracker.com/announce");
        decodedData.info.length.should.equal(29298);
        decodedData.info.name.toString().should.equal("TestData");
        decodedData.info["piece length"].should.equal(262144);
        decodedData.info.pieces.toString("hex").should.equal("5e07db59ef1f884c63bca5399f76607dcdba549e");
        done();
      });
    });

    it("should create a torrent with private flag", function (done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData",
        private: true
      });
      var ws = new MemoryStream();
      rs.pipe(ts);
      ts.pipe(ws);

      ws.on("finish", function () {
        var data = ws.getData();
        var decodedData = bencode.decode(data);
        decodedData.info.private.should.equal(1);
        done();
      });
    });

    it("should create a torrent with createdBy", function (done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData",
        createdBy: "Rob Riddle"
      });
      var ws = new MemoryStream();
      rs.pipe(ts);
      ts.pipe(ws);

      ws.on("finish", function () {
        var data = ws.getData();
        var decodedData = bencode.decode(data);
        decodedData["created by"].toString().should.equal("Rob Riddle");
        done();
      });
    });

    it("should create a torrent from a single stream with small pieceLength", function (done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData",
        pieceLength: 16384
      });
      var ws = new MemoryStream();
      rs.pipe(ts);
      ts.pipe(ws);

      ws.on("finish", function () {
        var data = ws.getData();
        var decodedData = bencode.decode(data);

        decodedData.announce.toString().should.equal("http://totally_a_real_tracker.com/announce");
        decodedData.info.length.should.equal(29298);
        decodedData.info.name.toString().should.equal("TestData");
        decodedData.info["piece length"].should.equal(16384);
        decodedData.info.pieces.toString("hex").should.equal("3c4d46e7ca4a00289fc66e8d7bd0984113b003c0a8a9fd65a26b843fe6b59c35d34ab2c5dd57367a");
        done();
      });
    });

    it("should fail with no name", function () {
      var err;
      try {
        new Torrent({
          announce: "http://totally_a_real_tracker.com/announce"
        });
      }
      catch (e) {
        err = e;
      }

      should.exist(err);
      err.message.should.equal("Torrent name is required");
    });

    it("should fail with no announce", function () {
      var err;
      try {
        new Torrent({
          name: "TestData"
        });
      }
      catch (e) {
        err = e;
      }

      should.exist(err);
      err.message.should.equal("Torrent announce url is required");
    });
  });
  describe("multi-file", function() {
    it("should create a torrent from multiple streams", function(done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var rs2 = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData",
        pieceLength: 16384
      });
      var ws = new MemoryStream();
      ts.addFile(rs, "test1");
      ts.addFile(rs2, "test2");
      ts.pipe(ws);

      ws.on("finish", function() {
        var data = ws.getData();
        var decodedData = bencode.decode(data);

        decodedData.announce.toString().should.equal("http://totally_a_real_tracker.com/announce");
        decodedData.info.length.should.equal(58596);
        decodedData.info.name.toString().should.equal("TestData");
        decodedData.info["piece length"].should.equal(16384);
        decodedData.info.pieces.toString("hex").should.equal("3c4d46e7ca4a00289fc66e8d7bd0984113b003c0d4723c91edefc5eb02afdf4830784f1b4dec77296c6caa72263493248670c2f58a6c7369b91892854b3311c770c98981c2f4d6329a9769b5a5e02997");

        decodedData.info.files[0].length.should.equal(29298);
        decodedData.info.files[1].length.should.equal(29298);

        decodedData.info.files[0].path.toString().should.equal("test1");
        decodedData.info.files[1].path.toString().should.equal("test2");
        decodedData.info.files.length.should.equal(2);
        done();
      });
    });

    it("should throw error if a file is added post-completion", function(done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var rs2 = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var rs3 = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        name: "TestData",
        pieceLength: 16384
      });
      var ws = new MemoryStream();
      ts.addFile(rs, "test1");
      ts.addFile(rs2, "test2");
      ts.pipe(ws);

      ws.on("finish", function() {
        var data = ws.getData();
        var decodedData = bencode.decode(data);
        var err;

        decodedData.announce.toString().should.equal("http://totally_a_real_tracker.com/announce");
        decodedData.info.length.should.equal(58596);
        decodedData.info.name.toString().should.equal("TestData");
        decodedData.info["piece length"].should.equal(16384);
        decodedData.info.pieces.toString("hex").should.equal("3c4d46e7ca4a00289fc66e8d7bd0984113b003c0d4723c91edefc5eb02afdf4830784f1b4dec77296c6caa72263493248670c2f58a6c7369b91892854b3311c770c98981c2f4d6329a9769b5a5e02997");

        decodedData.info.files[0].length.should.equal(29298);
        decodedData.info.files[1].length.should.equal(29298);

        decodedData.info.files[0].path.toString().should.equal("test1");
        decodedData.info.files[1].path.toString().should.equal("test2");
        decodedData.info.files.length.should.equal(2);

        try {
          ts.addFile(rs3, "test3");
        }
        catch (e) {
          err = e;
        }

        should.exist(err);
        err.message.should.equal("Torrent.addFile was called after stream was already finished");


        done();
      });
    });
  });

  describe("Multi-tracker", function() {
    it("should create a torrent with multiple trackers", function(done) {
      var rs = fs.createReadStream("test/testData.txt", {encoding: "utf8"});
      var ts = new Torrent({
        announce: "http://totally_a_real_tracker.com/announce",
        trackers: [["tracker1"], ["tracker2"]],
        name: "TestData"
      });
      var ws = new MemoryStream();
      rs.pipe(ts);
      ts.pipe(ws);

      ws.on("finish", function() {
        var data = ws.getData();
        var decodedData = bencode.decode(data);

        decodedData.announce.toString().should.equal("http://totally_a_real_tracker.com/announce");
        decodedData["announce-list"].should.be.a("array");
        decodedData["announce-list"].should.have.length(2);
        decodedData["announce-list"][0].should.be.a("array");
        decodedData["announce-list"][0].should.have.length(1);
        decodedData["announce-list"][0][0].toString().should.equal("tracker1");
        decodedData["announce-list"][1].should.be.a("array");
        decodedData["announce-list"][1].should.have.length(1);
        decodedData["announce-list"][1][0].toString().should.equal("tracker2");
        decodedData.info.length.should.equal(29298);
        decodedData.info.name.toString().should.equal("TestData");
        decodedData.info["piece length"].should.equal(262144);
        decodedData.info.pieces.toString("hex").should.equal("5e07db59ef1f884c63bca5399f76607dcdba549e");
        done();
      });
    });

    it("multi-tracker should fail if trackers is not an array", function() {
      var ts, err;
      try {
        ts = new Torrent({
          announce: "http://totally_a_real_tracker.com/announce",
          trackers: "tracker1",
          name: "TestData"
        });
      }
      catch (e) {
        err = e;
      }
      should.exist(err);
      err.message.should.equal("Torrent trackers must be an array");
    });

    it("multi-tracker should fail if trackers.tracker is not an array", function() {
      var ts, err;
      try {
        ts = new Torrent({
          announce: "http://totally_a_real_tracker.com/announce",
          trackers: ["tracker1"],
          name: "TestData"
        });
      }
      catch (e) {
        err = e;
      }
      should.exist(err);
      err.message.should.equal("Tracker list tracker1 in trackers is not an array");
    });

    it("multi-tracker should fail if a tracker is not a string", function() {
      var ts, err;
      try {
        ts = new Torrent({
          announce: "http://totally_a_real_tracker.com/announce",
          trackers: [["tracker1"], [1]],
          name: "TestData"
        });
      }
      catch (e) {
        err = e;
      }
      should.exist(err);
      err.message.should.equal("Invalid tracker: Tracker is not a string");
    });
  })
});