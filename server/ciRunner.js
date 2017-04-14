var fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	unzip = require('unzip2'),
	log = require('./log'),
	child_process = require('child_process');

function CIRunner(){}

CIRunner.prototype.runCI = function (cfg) {
	try{
		cfg.changesFolder = path.join(__dirname, '/unzipChanges/' + cfg.fname.substring(0, cfg.fname.indexOf(path.extname(cfg.fname))));
		fse.ensureDirSync(cfg.changesFolder);
		log.writeLog("start to run CI");
		var _this = this;

		function unzipChangesCB(){
			log.writeLog('unzip changes close');
			_this.applyChanges(cfg);
			_this.copyExecutionFiles(cfg);
			_this.runBat(cfg);
			_this.clearRunningFiles(cfg);
		}
		this.unzipChanges(cfg, unzipChangesCB);
	} catch (ex){
		fs.writeFileSync('uncaughtException.txt', ex);
	}

}
CIRunner.prototype.unzipChanges = function(cfg, cb){
	var unzipStream = unzip.Extract({ path: cfg.changesFolder })
	unzipStream.on('error', () => log.writeLog('unzip changes error') )
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
	log.writeLog("begin applyChanges", cfg);
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
CIRunner.prototype.copyExecutionFiles = function (cfg) {
	var extFolder = path.join(__dirname, '/extFiles');
	var destFolder = path.join(cfg.srcFolder, '/TC_DevTests/app');
	fse.copySync(path.join(extFolder, '/TruClient_Pre-CI_execution.bat'), path.join(destFolder, '/Extensions/Tools/TruClient_Pre-CI_execution.bat'));
	fse.copySync(path.join(extFolder, '/systest_server.js'), path.join(cfg.srcFolder, '/app/Extensions/External/SysTestNodeJsServer/node_modules/truclient/bin/systest_server.js'));
	fse.copySync(path.join(extFolder, '/pre_reportManager.js'), path.join(destFolder, '/RnRHelper/CI/pre_reportManager.js'));
	fse.copySync(path.join(extFolder, '/resultsManager.js'), path.join(destFolder, '/RnRHelper/CI/resultsManager.js'));
	fse.copySync(path.join(extFolder, '/timeManager.js'), path.join(destFolder, '/RnRHelper/CI/timeManager.js'));
}
CIRunner.prototype.runBat = function (cfg) {
	var batFileName = "TruClient_Pre-CI_execution.bat";
	var batFilePath = path.join(cfg.srcFolder, '/TC_DevTests/app/Extensions/Tools');
	log.writeLog('start to run execution bat');
	var out = fs.openSync(path.join(cfg.changesFolder,'/ci_out.log'), 'a');
	var err = fs.openSync(path.join(cfg.changesFolder,'/ci_err.log'), 'a');
	try{
		var ret = child_process.execFileSync(batFileName,[cfg.srcFolder,cfg.submitter],{cwd: batFilePath, stdio: ['ignore', out, err]});
	} catch(ex){
		fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
	}
	fs.closeSync(out);
	fs.closeSync(err);
	log.writeLog('CI execution finish', cfg, log.LogType.End);
	runTaskCallBack(cfg);
}
CIRunner.prototype.clearRunningFiles = function (cfg) {
	fse.removeSync(cfg.zipFile);
	fse.removeSync(changesFolder);
	fse.removeSync(cfg.srcFolder);
}
CIRunner.prototype.addTask = function (config) {
	this.taskQueue.push(config);
	process.nextTick(() => this.start());
}

var runner = new CIRunner();
process.on('message', function(msg) {
	runner.runCI(msg);
});

function runTaskCallBack(cfg){
	cfg.callback = function () {
		process.exit();
	};
	process.send(cfg);
}
//module.exports = new CIRunner();