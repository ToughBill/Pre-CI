var net = require('net'),
	fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	log = require('./log');

var server = net.createServer(function(conn) {
	log.writeLog('server connected');

	var isReady = false, fsize = 0, fname='', receSize = 0, tarFile, jsonDt;
	conn.on('data', function(data) {
		log.writeLog('data received');
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
					ciTaskManager.addTask(jsonDt);
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
	log.writeLog('server bound to ' + PORT );
	server.on('connection', function(){
		log.writeLog('connection build...');
	})
});

ciTaskManager.lanuchCopyProcess();

process.on('uncaughtException', (err) => {
	log.writeLog("CI execution finish", log.LogType.End);
	fs.writeFileSync('uncaughtException.txt', err);
});