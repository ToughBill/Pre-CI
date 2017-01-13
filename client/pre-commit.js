var fs = require('fs'),
	path = require('path'),
	io = require('socket.io-client'),
	ss = require('socket.io-stream'),
	fse = require('fs-extra'),
	archiver = require('archiver'),
	net = require('net');
	

	var startIdx = 2;
	if(process.argv.length == 7){
		var argv_isOnline = process.argv[startIdx] ? true : false;
		startIdx++;
	}
		
var argv_lstFilePath = process.argv[startIdx++],
	argv_depth = process.argv[startIdx++],
	argv_msgFilePath = process.argv[startIdx++],
	argv_cwd = process.argv[startIdx];
	

var LogUtil = function(){
	var logFile = path.join(__dirname, '/log');
	
	function init(){
		if(fs.existsSync(logFile)){
			fse.removeSync(logFile);
		}
		//fs.writeFileSync(str+'\n', str, "utf8");
	}
	function writeLog(str){
		if(argv_isOnline){
			fs.appendFileSync(logFile, str+'\n', "utf8");
		} else {
			console.log(str);
		}
	}
	
	return {
		init: init,
		writeLog: writeLog
	}
}();

try{
	
	LogUtil.init();
	LogUtil.writeLog('argv_isOnline: ' + argv_isOnline);
	LogUtil.writeLog('argv_lstFilePath: ' + argv_lstFilePath);
	LogUtil.writeLog('argv_depth: ' + argv_depth);
	LogUtil.writeLog('argv_msgFilePath: ' + argv_msgFilePath);
	LogUtil.writeLog('argv_cwd: ' + argv_cwd);
	
	collectChanges();
	LogUtil.writeLog('collectChanges finish.');
	zipChanges(sendChanges);
	//sendChanges(zipFile);
	//process.exit(1);
} catch (err){
	LogUtil.writeLog(new Error(err.toString()).stack);
} 

function collectChanges(){
	changesFolder = path.join(__dirname, '/changes'), 
		//contentFolder = path.join(changesFolder, '/content'),
		filesFolder = path.join(changesFolder, '/files');
	if(fs.existsSync(changesFolder)){
		fse.removeSync(changesFolder);
	}
	fs.mkdirSync(changesFolder);
	//fs.mkdirSync(contentFolder);
	fs.mkdirSync(filesFolder);
	
	
	var clInfo = path.join(changesFolder, "/clInfo");
	var tempStr = fs.readFileSync(argv_lstFilePath, "utf8");
	if(tempStr.trim() == '') 
		process.exit(0);

	var tempArr = tempStr.split("\r\n");
	var obj = {};
	obj.cwd = argv_cwd;
	obj.files = {};
	for(var i = 0; i < tempArr.length; i++){
		if(tempArr[i].trim() == '') continue;
		var isExist = fs.existsSync(tempArr[i]);
		obj.files[tempArr[i]] = isExist ? 1 : 0;
		if(isExist){
			var str = tempArr[i].substring(argv_cwd.length);
			fse.copySync(tempArr[i], path.join(filesFolder, str));
		}
	}
	fs.writeFileSync(clInfo, JSON.stringify(obj), "utf8");
}

function zipChanges(sendFunc){
	var zipFile = path.join(__dirname,'/zipChanges.zip');
	if(fs.existsSync(zipFile)){
		fse.removeSync(zipFile);
	}
	var output = fs.createWriteStream(zipFile);
	var zipArchive = archiver.create('zip',{});
	LogUtil.writeLog('zipChanges 1.');
	output.on('close', function() {
		LogUtil.writeLog('done with the zip.');
		if(sendFunc){
			LogUtil.writeLog('zipChanges finish.');
			sendFunc(zipFile);
		}
	});

	zipArchive.pipe(output);
	//process.chdir('changes');
	//zipArchive.directory('changes/');
	zipArchive.bulk([{ 
	  expand: true, cwd: changesFolder, 
	  src: ['**//*'] 
	}]);
	zipArchive.finalize(function(err, bytes) {
		if(err) {
			LogUtil.writeLog('zipChanges finalize fail, '+err.toString());
		  //throw err;
		}
	});
	
	return zipFile;
}

function sendChanges(zipFile){
	LogUtil.writeLog("**** enter sendChanges method ****");
	var PORT = 9093;
	//var HOST = '127.0.0.1';
	var HOST = 'myd-vm21658.hpeswlab.net';
	var client = new net.Socket();
	client.connect(PORT,HOST,function() {
		client.setEncoding('utf8');
		var stats = fs.statSync(zipFile)
		var fileSizeInBytes = stats["size"];
		var obj = {};
		obj.fsize = fileSizeInBytes;
		obj.fname = path.basename(zipFile);
		obj.submitter = path.basename(process.env['USERPROFILE']);
		client.write(JSON.stringify(obj), 'utf8');
		//client.write('{"fsize":'+fileSizeInBytes+',"fname":"'+zipFile+'"}', 'utf8');
		client.on('data', function(data){
			if(data == 'wait'){
				var fileStream = fs.createReadStream(zipFile);
				fileStream.on('error', function(err){
					LogUtil.writeLog("run into error when reading the zip file....");
					LogUtil.writeLog(err.toString());
				})
				fileStream.on('data', function(chunk){
					client.write(chunk);
				});
			} else if(data == 'finish'){
				LogUtil.writeLog("send zip file successfully. exiting...");
				client.destroy();
				finish();
			}
		});
	});

	//handle closed
	client.on('close', function() {
		LogUtil.writeLog("connection closed.");
	});

	client.on('error', function(err) {
		LogUtil.writeLog(err.toString());
	});
}

function showTips() {
	process.stderr.write("send CI request successfully! Please wait for the result.");
}

function finish(){
	process.exit(1);
}




