var fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	unzip = require('unzip2'),
	log = require('./log'),
	copyBuild = require('./copyBuild'),
	child_process = require('child_process');

function CIRunner(){
	this.taskQueue = [];
	this.isWorking = false;
}

CIRunner.prototype.start = function () {
	if(this.isWorking)
		return;
	
	while(this.taskQueue.length > 0){
		var cfg = this.taskQueue.shift();
		this.runCI(cfg);
	}
}
CIRunner.prototype.runCI = function (cfg) {
	function cloneBuildCB(cfg){
		this.applyChanges(cfg);
		this.copyExecutionFiles(cfg);
		this.runBat(cfg);
	}
	function unzipChangesCB(){
		log.writeLog('unzip changes close', true);
		copyBuild.cloneDefault(cfg, cloneBuildCB);
	}
	this.unzipChanges(cfg, unzipChangesCB);
}
CIRunner.prototype.unzipChanges = function(cfg, cb){
	cfg.changesFolder = path.join(__dirname, '/unzipChanges/' + cfg.fname);
	fse.ensureDirSync(cfg.changesFolder);
	var unzipStream = unzip.Extract({ path: cfg.changesFolder })
	unzipStream.on('error', function () { log.writeLog('unzip changes error') })
	unzipStream.on('close', function () {
		cb(cfg);
	})
	unzipStream.on('end', function () {
		log.writeLog('unzip changes end');
	});

	fs.createReadStream(cfg.zipFile).pipe(unzipStream);
}
CIRunner.prototype.applyChanges = function(cfg){
	var clInfo = fs.readFileSync(path.join(cfg.changesFolder,'/clInfo'));
	var infoObj = JSON.parse(clInfo);
	log.writeLog("begin applyChanges");
	for(var name in infoObj.files){
		var idx = name.indexOf('trunk');
		if(idx < 0)
			continue;
		var source = path.join(cfg.changesFolder+'/files', name.substring(infoObj.cwd.length)),
			dest = path.join(cfg.srcFolder, name.substring(idx + 'trunk'.length));
		if(infoObj.files[name]){
			fse.copySync(source, dest);
		} else {
			fse.removeSync(dest);
		}

	}
	log.writeLog("end applyChanges");
}
CIRunner.prototype.copyExecutionFiles = function () {
	var extFolder = path.join(__dirname, '/extFiles');
	var destFolder = path.join(cfg.srcFolder, '/TC_DevTests/app');
	fse.copySync(path.join(extFolder, '/TruClient_Pre-CI_execution.bat'), path.join(destFolder, '/Extensions/Tools/TruClient_Pre-CI_execution.bat'));
	fse.copySync(path.join(extFolder, '/systest_server.js'), path.join(cfg.srcFolder, '/app/Extensions/External/SysTestNodeJsServer/node_modules/truclient/bin/systest_server.js'));
	fse.copySync(path.join(extFolder, '/pre_reportManager.js'), path.join(destFolder, '/RnRHelper/CI/pre_reportManager.js'));
	fse.copySync(path.join(extFolder, '/resultsManager.js'), path.join(destFolder, '/RnRHelper/CI/resultsManager.js'));
	fse.copySync(path.join(extFolder, '/timeManager.js'), path.join(destFolder, '/RnRHelper/CI/timeManager.js'));
}
CIRunner.prototype.runBat = function (cfg) {
	var batFile = path.join(cfg.srcFolder, '/TC_DevTests/app/Extensions/Tools/TruClient_Pre-CI_execution.bat');
	log.writeLog('start run bat: ' );
	var ret = child_process.execFileSync(batFile,[cfg.srcFolder,cfg.submitter],{cwd:__dirname});
	log.writeLog('execute bat result: ' + ret);
}
CIRunner.prototype.addTask = function (config, cb) {
	this.taskQueue.push({cfg: config, cb: cb});
	process.nextTick(() => this.start());
}

module.exports = new CIRunner();