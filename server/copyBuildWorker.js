var fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	log = require('./log'),
	iniParser = require('node-ini'),
	child_process = require('child_process');

function CopyBuild(){
	this.SOURCE_BUILD_PATH = 'P:\\TCS\\TCS\\win32_release\\Default';
	this.ROOT_BUILD_FOLDER = "c:\\precibuild";
	this.DEFAULT_LATEST_BUILD = path.join(this.ROOT_BUILD_FOLDER, '\\Default');

	this.ENV_CFG = 'env.cfg';
	this.taskQueue = [];
	this.copyingSource = false;
	this.cloningBuild = false;
	this.isWorking = false;
}

CopyBuild.prototype.start = function(){
	if(this.isWorking)
		return;

	var _this = this;
	function watchFunc() {
		if(_this.copyingSource || _this.cloningBuild) return;
		if(_this.hasNewBuild()){
			_this.copySourceBuild();
		}
	}
	setInterval(watchFunc, 60*1000);
	this.isWorking = true;
}

CopyBuild.prototype.cloneDefault = function(cfg, cb){
	this.copySourceBuild();
	var dt = Date.now();
	var target = path.join(this.ROOT_BUILD_FOLDER, '\\' + dt);
	fse.mkdirsSync(target);
	log.writeLog("start to clone build");
	fse.copySync(this.DEFAULT_LATEST_BUILD, target);
	//copySync(this.DEFAULT_LATEST_BUILD, target);
	log.writeLog("end clone build");
	cfg.srcFolder = target;
	cb(cfg);
}
CopyBuild.prototype.getBuildPath = function (cfg) {
	this.taskQueue.add(cfg);
	if(this.copyingSource || this.cloningBuild){
		return;
	}
	this.startClone();
}
CopyBuild.prototype.startClone = function() {
	if(this.copyingSource || this.cloningBuild || this.taskQueue.length <= 0) {
		return;
	}
	this.cloningBuild = true;
	var task = this.taskQueue.shift();
	var dt = Date.now();
	var target = path.join(this.ROOT_BUILD_FOLDER, '\\' + dt);
	fse.mkdirsSync(target);
	log.writeLog("start to clone build");
	fse.copySync(this.DEFAULT_LATEST_BUILD, target);
	log.writeLog("end clone build");
	task.srcFolder = target;
	setPathBack(task);
	this.cloningBuild = false;
	this.startClone();
}
CopyBuild.prototype.copySourceBuild = function(){
	this.copyingSource = true;
	if(fs.existsSync(this.DEFAULT_LATEST_BUILD)){
		log.writeLog("delete old Default folder");
		fse.removeSync(this.DEFAULT_LATEST_BUILD);
		fse.mkdirsSync(this.DEFAULT_LATEST_BUILD);
		log.writeLog("delete old Default folder completely");
	}

	log.writeLog("start to copy source");
	//fse.copySync(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
	this.__interCopySync(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
	log.writeLog("end copy source");
	this.copyingSource = false;
	this.startClone();
}

CopyBuild.prototype.__interCopySync = function(source, target){
	var ret = true;
	try{
		var exePath = path.join(__dirname, "/fastcopy/FastCopy.exe");
		var retStr = child_process.execFileSync(exePath,["/cmd=diff", "/bufsize=1024", "/force_close", source, "/to=" + target],{cwd: __dirname});
		//log.writeLog("copy result:");
		//log.writeLog(retStr);
	} catch(ex){
		ret = false;
		fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
	}

	return ret;
}

CopyBuild.prototype.hasNewBuild = function(){
	var curBuildCfg = path.join(this.DEFAULT_LATEST_BUILD, '/env.cfg');
	if(!fs.existsSync(curBuildCfg)){
		return true;
	}

	var cfgPath = path.join(this.SOURCE_BUILD_PATH, '/env.cfg');
	var env = iniParser.parseSync(cfgPath);
	var newBuildNo = env.ec_build_number;

	env = iniParser.parseSync(curBuildCfg);
	var curBuildNo = env.ec_build_number;
	if(parseInt(newBuildNo) > parseInt(curBuildNo)){
		return true;
	}

	return false;
}

var copyInst = new CopyBuild();
copyInst.start();

process.on('message', function(msg) {
	if(msg.hasOwnProperty("getBuildPath")){
		copyInst.getBuildPath(msg["getBuildPath"]);
	}
});

function setPathBack(task){
	process.send(task);
}
//module.exports = new CopyBuild();