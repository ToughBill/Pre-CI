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
			log.writeLog("new build found, start to copy");
			_this.copySourceBuild();
		}
	}
	setInterval(watchFunc, 60*1000);
	this.isWorking = true;
}

CopyBuild.prototype.getBuildPath = function (cfg) {
	this.taskQueue.push(cfg);
	if(this.copyingSource || this.cloningBuild){
		log.writeLog((this.copyingSource ? "copying source now" : "cloning build now") + ", wait.");
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
	fse.copy(this.DEFAULT_LATEST_BUILD, target, err => {
		if(err){
			log.writeLog("clone build fail");
		}
		log.writeLog("end clone build");
		task.srcFolder = target;
		setPathBack(task);
		this.cloningBuild = false;
		this.startClone();
	});
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
	this.__interCopy(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
}

CopyBuild.prototype.__interCopy = function(source, target){
	var ret = true, _this = this;
	try{
		var exePath = path.join(__dirname, "/fastcopy/FastCopy.exe");
		child_process.execFile(exePath,["/cmd=diff", "/bufsize=1024", "/force_close", source, "/to=" + target],{cwd: __dirname}, (error, stdout, stderr) => {
			if(error){
				log.writeLog("copy source error, error info: " + stderr);
				return;
			}
			log.writeLog("end copy source");
			this.copyingSource = false;
			this.startClone();
		});
	} catch(ex){
		ret = false;
		fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
	}

	return ret;

	// var ret = true;
	// try{
	// 	var exePath = path.join(__dirname, "/fastcopy/FastCopy.exe");
	// 	var retStr = child_process.execFileSync(exePath,["/cmd=diff", "/bufsize=1024", "/force_close", source, "/to=" + target],{cwd: __dirname});
	// 	//log.writeLog("copy result:");
	// 	//log.writeLog(retStr);
	// } catch(ex){
	// 	ret = false;
	// 	fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
	// }
    //
	// return ret;
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