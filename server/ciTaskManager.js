var fs = require('fs'),
	fse = require('fs-extra'),
	path = require('path'),
	unzip = require('unzip2'),
	log = require('./log'),
	copyBuild = require('./copyBuild'),
	child_process = require('child_process');

function CITaskManager(){
	this.taskQueue = [];
	this.isRunning = false;
	this.runnerProcess = null;
	this.copyBuildProcess = null;
}

CITaskManager.prototype.runTask = function () {
	log.writeLog('run Task this.isRunning:' + this.isRunning + 'this.taskQueue.length:' + this.taskQueue.length);
	if(this.isRunning || this.taskQueue.length <= 0)
		return;
	var _this = this;
	function execCB(msg){
		log.writeLog("receive message from ci-runner process. current task queue's length: " + _this.taskQueue.length)
		if(_this.taskQueue.length <= 0){
			_this.isRunning = false;
			return;
		}
		var nextTask = _this.taskQueue.shift();
		_this.runnerProcess.send(nextTask);
	}

	this.isRunning = true;
	var task = this.taskQueue.shift();
	if(!this.runnerProcess){
		this.runnerProcess = child_process.fork(__dirname + "/ciRunner.js");
		this.runnerProcess.on("message", execCB);
	}
	this.runnerProcess.send(task);
}
CITaskManager.prototype.addTask = function (task) {
	this.copyBuildProcess.send({"getBuildPath": task});
}

CITaskManager.prototype.lanuchCopyProcess = function () {
	this.copyBuildProcess = child_process.fork(__dirname + "/copyBuildWorker.js");
	this.copyBuildProcess.on("message", (msg) => {
		this.taskQueue.push(msg);
		log.writeLog('addTask, current status:' + (this.isRunning ? 'running' : 'stop'));
		if(this.isRunning){
			return;
		}
		this.runTask();
	});
}

module.exports = new CITaskManager();