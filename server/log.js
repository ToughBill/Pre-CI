var fs = require('fs'),
	path = require('path');

function Log(_cfg){
	this.cfg = _cfg || {};
	this.init();
}
Log.prototype.LogType = {
	Start: 1,
	Content: 2,
	End: 3
}
Log.prototype.init = function(){
	var configFile = path.join(__dirname, '/config');
	if(!fs.existsSync(configFile)){
		this.cfg.toFile = false;
		this.cfg.taskLogFileName = "extLog.log";
	} else {
		var str = fs.readFileSync(configFile);
		var obj = JSON.parse(str);
		this.cfg.toFile = obj.SaveLogToFile || false;
		this.cfg.taskLogFileName = obj.TaskLogFileName || "extLog.log";
	}
}
Log.prototype.writeLog = function(str, taskCfg, logType){
	var dt = new Date(), log;
	var timeStr = ', time: ' + dt.getHours() + ':' + dt.getMinutes() + ":" + dt.getSeconds();
	// if(taskCfg){
	// 	switch(logType){
	// 		case this.LogType.Start:
	// 		case this.LogType.End:
	// 			log = "******  " + str + timeStr + "  ******";
	// 			break;
	// 		default:
	// 			log = "      ***  " + str + timeStr + "   ***      ";
	// 			break;
	// 	}
	// } else {
	// 	log = "******  " + str + timeStr + "  ******";
	// }
	log = str + timeStr;
	if(this.cfg.toFile && taskCfg && taskCfg.changesFolder){
		fs.appendFileSync(path.join(taskCfg.changesFolder, '/' + this.cfg.taskLogFileName), log + '\n', "utf8");
	}
	console.log(log);
}

module.exports = new Log();