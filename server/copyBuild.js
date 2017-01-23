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
	this.isCloning = false;
}

CopyBuild.prototype.start = function(){
	if(this.isCloning || this.taskQueue.length <= 0)
		return;
	
}

CopyBuild.prototype.cloneDefault = function(cfg, cb){
	this.copySourceBuild();
	var dt = Date.now();
	var target = path.join(this.ROOT_BUILD_FOLDER, '\\' + dt);
	fse.mkdirsSync(target);
	log.writeLog("start to clone build", true);
	//fse.copySync(this.DEFAULT_LATEST_BUILD, target);
	copySync(this.DEFAULT_LATEST_BUILD, target);
	log.writeLog("end clone build", true);
	cfg.srcFolder = target;
	cb(cfg);
}
CopyBuild.prototype.copySourceBuild = function(){
	if(!this.hasNewBuild()){
		return;
	}
	if(fs.existsSync(this.DEFAULT_LATEST_BUILD)){
		log.writeLog("delete old Default folder", true);
		fse.removeSync(this.DEFAULT_LATEST_BUILD);
		fse.mkdirsSync(this.DEFAULT_LATEST_BUILD);
		log.writeLog("delete completely", true);
	}
	
	var dts=new Date();
	log.writeLog("start to copy source",true);
	//fse.copySync(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
	copySync(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
	var dte = new Date();
	log.writeLog("end copy source",true);
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

function copySync(source, target){
	var ret = true;
	try{
		var exePath = path.join(__dirname, "/fastcopy/FastCopy.exe");
		var retStr = child_process.execFileSync(exePath,["/cmd=diff", "/bufsize=1024", "/force_close", source, "/to=" + target],{cwd: __dirname});
		log.writeLog("copy result:");
		log.writeLog(retStr);

	} catch(ex){
		ret = false;
		fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
	}

	return ret;
}


module.exports = new CopyBuild();