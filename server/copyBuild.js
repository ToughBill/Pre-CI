var fs = require('fs'),
	path = require('path'),
	log = require('./log'),
	iniParser = require('node-ini');

function CopyBuild(){
	this.SOURCE_BUILD_PATH = 'P:\\TCS\\TCS\\win32_release\\Default';
	this.DEFAULT_LATEST_BUILD = path.join(__dirname, '\\build\\Default');
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
	var target = path.join(__dirname, '\\build\\' + dt);
	fse.mkdirsSync(target);
	log.writeLog("start to clone build");
	fse.copySync(this.DEFAULT_LATEST_BUILD, target);
	log.writeLog("end clone build");
	cfg.srcFolder = target;
	cb();
}
CopyBuild.prototype.copySourceBuild = function(){
	if(!this.hasNewBuild()){
		return;
	}
	if(fs.existsSync(this.DEFAULT_LATEST_BUILD)){
		writeLog("delete old Default folder", true);
		fse.removeSync(this.DEFAULT_LATEST_BUILD);
		fse.mkdirsSync(this.DEFAULT_LATEST_BUILD);
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

module.exports = new CopyBuild();