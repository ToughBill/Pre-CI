var net = require('net'),
	fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path');
	unzip = require('unzip2');
	buffer = require('buffer'),
	iniParser = require('node-ini'),
	child_process = require('child_process');

var CIRunner = function(){
	var zipFile, changesFolder;
	
	function unzipChanges(){
		changesFolder = path.join(__dirname, '/unzipChanges');
		ensurePathExist(changesFolder);
		/*console.log('zipFile: ' + zipFile);
		var stats = fs.statSync(zipFile)
		var fileSizeInBytes = stats["size"];*/
		var unzipStream = unzip.Extract({ path: changesFolder })
		unzipStream.on('error', function () { console.log('unzip changes error') })
		unzipStream.on('close', function () { 
			console.log('unzip changes close');
			var srcFolder = CopyBuild.cloneDefault();
			applyChanges(srcFolder);	
			copyExecutionFiles(srcFolder);
			runCI(srcFolder);
		})
		unzipStream.on('end', function () { 
			console.log('unzip changes end');
			
		});
	
		fs.createReadStream(zipFile).pipe(unzipStream);
	}
	function applyChanges(srcFolder){
		var clInfo = fs.readFileSync(path.join(changesFolder,'/clInfo'));
		var infoObj = JSON.parse(clInfo);
		writeLog("begin applyChanges");
		for(var name in infoObj.files){
			var idx = name.indexOf('trunk');
			if(idx < 0) 
				continue;
			var source = path.join(changesFolder+'/files', name.substring(infoObj.cwd.length)),
				dest = path.join(srcFolder, name.substring(idx + 'trunk'.length));
			if(infoObj.files[name]){
				fse.copySync(source, dest);
			} else {
				fse.removeSync(dest);
			}
			
		}
		/*for(var i = 0; i < infoObj.files.length; i++){
			console.log("applyChanges file: "+infoObj.files[i]);
			var idx = infoObj.files[i].indexOf('trunk');
			if(idx < 0) continue;
			var destFile = path.join(changesFolder, infoObj.files[i].substring(idx + 'trunk'.length));
			console.log("applyChanges file destiation: "+destFile);
			fse.copySync(infoObj.files[i], destFile);
		}*/
		writeLog("end applyChanges");
	}
	function copyExecutionFiles(srcFolder){
		var extFolder = path.join(__dirname, '/extFiles');
		var destFolder = path.join(srcFolder, '/TC_DevTests/app');
		fse.copySync(path.join(extFolder, '/TruClient_Pre-CI_execution.bat'), path.join(destFolder, '/Extensions/Tools/TruClient_Pre-CI_execution.bat'));
		fse.copySync(path.join(extFolder, '/systest_server.js'), path.join(srcFolder, '/app/Extensions/External/SysTestNodeJsServer/node_modules/truclient/bin/systest_server.js'));
		fse.copySync(path.join(extFolder, '/pre_reportManager.js'), path.join(destFolder, '/RnRHelper/CI/pre_reportManager.js'));
		fse.copySync(path.join(extFolder, '/resultsManager.js'), path.join(destFolder, '/RnRHelper/CI/resultsManager.js'));
		fse.copySync(path.join(extFolder, '/timeManager.js'), path.join(destFolder, '/RnRHelper/CI/timeManager.js'));
	}
	function runCI(srcFolder){
		var batFile = path.join(srcFolder, '/TC_DevTests/app/Extensions/Tools/TruClient_Pre-CI_execution.bat');
		console.log('start run bat: ' );
		var ret = child_process.execFileSync(batFile,[srcFolder,'bli@hpe.com'],{cwd:__dirname});
		console.log('execute bat result: ' + ret);
	}
	
	function startToRunCI(data){
		zipFile = data;
		unzipChanges();
		
	}
	
	
	return {
		startToRunCI: startToRunCI
	}
}();

var CopyBuild = function(){
	var SOURCE_BUILD_PATH = 'P:\\TCS\\TCS\\win32_release\\Default';
	var DEFAULT_LATEST_BUILD = path.join(__dirname, '\\build\\Default');
	var ENV_CFG = 'env.cfg';
		
	
	function cloneDefault(){
		copySourceBuild();
		var dt = Date.now();
		var target = path.join(__dirname, '\\build\\' + dt);
		fse.mkdirsSync(target);
		var dts=new Date();
		console.log("******  start clone, time: " + dts.getMinutes() + ":" + dts.getSeconds() + "  ******");
		fse.copySync(DEFAULT_LATEST_BUILD, target);
		var dte = new Date();
		console.log("******  end clone, time: " + dte.getMinutes() + ":" + dte.getSeconds() + "  ******");
		
		return target;
	}
	
	function copySourceBuild(){
		return;
		if(!hasNewBuild()){
			return;
		}
		if(fs.existsSync(DEFAULT_LATEST_BUILD)){
			writeLog("delete old Default folder", true);
			fse.removeSync(DEFAULT_LATEST_BUILD);
			fse.mkdirsSync(DEFAULT_LATEST_BUILD);
			writeLog("delete completely", true);
		}
		
		var dts=new Date();
		console.log("******  start copy source, time: " + dts.getMinutes() + ":" + dts.getSeconds() + "  ******");
		console.log("******  source: " + SOURCE_BUILD_PATH + "  ******");
		console.log("******  destination: " + DEFAULT_LATEST_BUILD + "  ******");
		fse.copySync(SOURCE_BUILD_PATH, DEFAULT_LATEST_BUILD);
		var dte = new Date();
		console.log("******  end copy source, time: " + dte.getMinutes() + ":" + dte.getSeconds() + "  ******");
		
		
	}
	
	function hasNewBuild(cb){
		var curBuildCfg = path.join(DEFAULT_LATEST_BUILD, '/env.cfg');
		if(!fs.existsSync(curBuildCfg)){
			return true;
		}
		
		var cfgPath = path.join(SOURCE_BUILD_PATH, '/env.cfg');
		var env = iniParser.parseSync(cfgPath);
		var newBuildNo = env.ec_build_number;
		
		env = iniParser.parseSync(curBuildCfg);
		var curBuildNo = env.ec_build_number;
		
		if(parseInt(newBuildNo) > parseInt(curBuildNo)){
			return true;
		}
		
		return false;
	}
	
	return {
		cloneDefault: cloneDefault
	}
}();

var server = net.createServer(function(conn) {
    console.log('server connected');
	
	var isReady = false, fsize = 0, fname='', receSize = 0, tarFile;
    conn.on('data', function(data) {
        console.log('data received');
		if(!isReady){
			var jsonDt = JSON.parse(data);
			console.log('get file size: ' + data);
			fsize = parseInt(jsonDt.fsize);
			fname = jsonDt.fname;
			conn.write('wait');
			tarFile = null;
			isReady=true;
		} else {
			receSize += data.length;
			console.log('chunk size: '+data.length+', total receive size: '+receSize);
			if(!tarFile){
				var destFolder = path.join(__dirname, '/changes');
				ensurePathExist(destFolder);
				var destFile = path.join(destFolder, fname);
				tarFile = fs.createWriteStream(destFile);
				tarFile.on('close', function(){
					CIRunner.startToRunCI(tarFile.path);
				});
			}
			
			tarFile.write(data);
			if(receSize >= fsize){
				tarFile.end();
				conn.write('finish');
				//console.log('destFile: ' + tarFile.path);
				
			}
		}
		
        //conn.pipe(fs.createWriteStream('zipfile.txt'));
		//console.log(data.toString());
    });
});

//var HOST = '127.0.0.1';
var HOST = '0.0.0.0';
var PORT = '9093';

server.listen(PORT, HOST, function() {
    //listening
    console.log('server bound to ' + PORT + '\n');
    server.on('connection', function(){
        console.log('connection made...\n')
    })
});

function ensurePathExist(path){
	if(!fs.existsSync(path))
		fs.mkdirSync(path);
}

function writeLog(str, withTime){
	var timeStr='';
	if(withTime){
		var dt = new Date();
		timeStr = ', time: ' + dt.getHours() + ':' + dt.getMinutes() + ":" + dt.getSeconds();
	}
	console.log("******  " + str + timeStr + "  ******");
}

process.on('uncaughtException', (err) => {
  fs.writeFileSync('uncaughtException.txt', err);
});