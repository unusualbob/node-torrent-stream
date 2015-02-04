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
