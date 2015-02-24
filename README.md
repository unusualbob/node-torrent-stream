# node-torrent-stream
Create a torrent from a readStream in node.js

#Usage
```
var torrent = new Torrent(options);
```
###Options
`announce: {String, required}` - The url of the torrent tracker  
`name: {String, required}` - The name of this torrent  
`pieceLength: {Number, optional}` - The size in mebibytes for each piece, should be a power of 2  
`encoding: {String, optional}` - The string encoding type for generating pieces  
`createdBy: {String, optional}` - Torrent author name  
`private: {Boolean, optional}` - Flag used for private trackers to prevent DHT peering  

### Method: addFile(stream, path);
`stream: {Stream, required}` - A readable stream which is the source of data you want to add to the torrent  
`path: {String, required}` - A string representation of the path for this file, ex: 'file.txt'  


#Examples

##Single file
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

##Multi-file

```
var rs1 = fs.createReadStream('./README.md');
var rs2 = fs.createReadStream('./license.md');
var nws = fs.createWriteStream('./multi' + Date.now() + '.torrent');

var mts = new Torrent({
  announce: "http://totally_a_real_tracker.com/announce",
  name: "MyDirectory",
  encoding: 'UTF-8',
  pieceLength: 2097152
});

//Must use addFile for mutli-file operations, eventually a directory method will be added to do this automatically
mts.addFile(rs1, 'readme.md');
mts.addFile(rs2, 'license.md');
mts.pipe(nws);
```