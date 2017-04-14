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

	function watchFunc() {
		if(this.isCloning) return;
		if(this.hasNewBuild()){
			this.copySourceBuild();
		}
	}

	setInterval(watchFunc, 60*1000);
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
	if(this.isCloning){
		return;
	}
	this.startClone(cfg);
}
CopyBuild.prototype.startClone = function (cfg) {
	if(this.taskQueue.length <= 0) {
		this.isCloning = false;
		return;
	}
	var task = this.taskQueue.shift();
	var dt = Date.now();
	var target = path.join(this.ROOT_BUILD_FOLDER, '\\' + dt);
	fse.mkdirsSync(target);
	log.writeLog("start to clone build");
	fse.copy(this.DEFAULT_LATEST_BUILD, target, err => {
		log.writeLog("end clone build");
		cfg.srcFolder = target;
		setPathBack(cfg);
		this.startClone();
	});
}
CopyBuild.prototype.copySourceBuild = function(){
	// if(!this.hasNewBuild()){
	// 	return;
	// }
	this.isCloning = true;
	var _this = this;

	function internalCopy(source, target){
		var ret = true, retStr;
		try{
			var exePath = path.join(__dirname, "/fastcopy/FastCopy.exe");
			child_process.execFile(exePath,["/cmd=diff", "/bufsize=1024", "/force_close", source, "/to=" + target],{cwd: __dirname}, function(err, stdout, stderr){
				_this.isCloning = false;
				if(err){
					ret = false;
					retStr = stderr;
				} else {
					ret = true;
					retStr = stdout;
				}

				log.writeLog("copy result:");
				log.writeLog(retStr);
				var dte = new Date();
				log.writeLog("end copy source");
			});
		} catch(ex){
			ret = false;
			fs.writeFileSync(path.join(cfg.srcFolder, '/ciUncaughtException.txt'), ex);
		}

		return ret;
	}

	if(fs.existsSync(this.DEFAULT_LATEST_BUILD)){
		log.writeLog("delete old Default folder");
		fse.remove(this.DEFAULT_LATEST_BUILD, err => {
			fse.mkdirsSync(this.DEFAULT_LATEST_BUILD);
			log.writeLog("delete completely");

			var dts=new Date();
			log.writeLog("start to copy source");
			//fse.copySync(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
			internalCopy(this.SOURCE_BUILD_PATH, this.DEFAULT_LATEST_BUILD);
		});
	}
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

function setPathBack(cfg){
	process.send(cfg);
}
//module.exports = new CopyBuild();