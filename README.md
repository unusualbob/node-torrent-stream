# node-torrent-stream
Create a torrent from a readStream in node.js

#Usage

```
var fs = require('fs');
var Torrent = require('node-torrent-stream');

//Some sort of readable stream which is one file to be turned into a torrent
var rs = fs.createReadStream('./myFile.md');

//Some sort of writeable stream to which a torrent file will be written
var ws = fs.createWriteStream('./test' + Date.now() + '.torrent');

//The torrent streamer
var ts = new Torrent({announce: 'test.com', name: 'test'});

rs.pipe(ts);
x.pipe(ws);

```