var fs = require('fs');

function Log(){
	this.cfg = {};
}
Log.prototype.LogType = {
	Start: 1,
	Content: 2,
	End: 3
}
Log.prototype.init = function(cfg){
	this.cfg = cfg;
}
Log.prototype.writeLog = function(str, logType){
	var log='', dt = new Date();
	var timeStr = ', time: ' + dt.getHours() + ':' + dt.getMinutes() + ":" + dt.getSeconds();
	switch(logType){
		case this.LogType.Start:
		case this.LogType.End:
			log = "******  " + str + timeStr + "  ******";
			break;
		case this.LogType.Content:
			log = "      ***  " + str + timeStr + "   ***      ";
			break;
		default:
			log = str;
			break;
	}
	//}
	if(this.cfg.toFile){

	} else {
		console.log(log);
	}
}

module.exports = new Log();