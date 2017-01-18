var net = require('net'),
	fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	buffer = require('buffer'),
	log = require('./log'),
	ciRunner = require('./ciRunner');

var server = net.createServer(function(conn) {
	log.writeLog('server connected');

	var isReady = false, fsize = 0, fname='', receSize = 0, tarFile;
	conn.on('data', function(data) {
		log.writeLog('data received');
		var jsonDt;
		if(!isReady){
			jsonDt = JSON.parse(data);
			log.writeLog('zip file info: ' + data);
			fsize = parseInt(jsonDt.fsize);
			fname = jsonDt.fname;
			conn.write('wait');
			tarFile = null;
			isReady=true;
		} else {
			receSize += data.length;
			log.writeLog('chunk size: '+data.length+', total receive size: '+receSize);
			if(!tarFile){
				var destFolder = path.join(__dirname, '/changes');
				fse.ensureDirSync(destFolder);
				var destFile = path.join(destFolder, fname);
				tarFile = fs.createWriteStream(destFile);
				tarFile.on('close', function(){
					jsonDt.zipFile = tarFile.path;
					ciRunner.addTask(jsonDt);
				});
			}

			tarFile.write(data);
			if(receSize >= fsize){
				tarFile.end();
				conn.write('finish');
			}
		}
	});
});

//var HOST = '127.0.0.1';
var HOST = '0.0.0.0';
var PORT = '9093';

server.listen(PORT, HOST, function() {
	//listening
	log.writeLog('server bound to ' + PORT + '\n');
	server.on('connection', function(){
		log.writeLog('connection made...\n')
	})
});

process.on('uncaughtException', (err) => {
	fs.writeFileSync('uncaughtException.txt', err);
});