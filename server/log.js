var fs = require('fs');

function Log(){
	this.logPath = '';
}
Log.prototype.init = function(){}
Log.prototype.writeLog = function(str, withTime){
	var timeStr='';
	if(withTime){
		var dt = new Date();
		timeStr = ', time: ' + dt.getHours() + ':' + dt.getMinutes() + ":" + dt.getSeconds();
	}
	console.log("******  " + str + timeStr + "  ******");
}

exports.log = new Log();