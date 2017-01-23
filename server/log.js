var fs = require('fs');

function Log(){
	this.cfg = {};
}
Log.prototype.init = function(cfg){
	this.cfg = cfg;
}
Log.prototype.writeLog = function(str, withTime){
	var timeStr='';
	//if(withTime){
		var dt = new Date();
		timeStr = ', time: ' + dt.getHours() + ':' + dt.getMinutes() + ":" + dt.getSeconds();
	//}
	if(this.cfg.toFile){

	} else {
		console.log("******  " + str + timeStr + "  ******");
	}
}

module.exports = new Log();