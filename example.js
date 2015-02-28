var fs = require('fs');
var Torrent = require('./index');

//Some sort of readable stream which is one file to be turned into a torrent
var rs = fs.createReadStream('./README.md');

//Some sort of writeable stream to which a torrent file will be written
var ws = fs.createWriteStream('./test' + Date.now() + '.torrent');

//The torrent streamer
var ts = new Torrent({
  announce: "http://totally_a_real_tracker.com/announce",
  name: "ReadMe",
  pieceLength: 65536, //64k = 65536, 256k = 262144, 512k = 524288 (defaults to 256k)
  createdBy: "Rob Riddle"
});

rs.pipe(ts);
ts.pipe(ws);


/**
 * Mutli-file example
 */

var rs1 = fs.createReadStream('./README.md');
var rs2 = fs.createReadStream('./license.md');
var nws = fs.createWriteStream('./multi' + Date.now() + '.torrent');

var mts = new Torrent({
  announce: "http://totally_a_real_tracker.com/announce",
  name: "MyDirectory",
  encoding: 'UTF-8',
  pieceLength: 2097152
});

mts.addFile(rs1, 'readme.md');
mts.addFile(rs2, 'license.md');
mts.pipe(nws);

/**
 * Multi-tracker example
 */

var rs3 = fs.createReadStream('./README.md');
var tws = fs.createWriteStream('./tracker' + Date.now() + '.torrent');

var ts2 = new Torrent({
  name: "ReadMe",
  trackers: [["tracker1", "tracker2"], ["backup1"]]
});

rs3.pipe(ts2);
ts2.pipe(tws);
