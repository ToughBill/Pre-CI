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
}

CITaskManager.prototype.runTask = function () {
	if(this.isRunning || this.taskQueue.length <= 0)
		return;

	function execCB(msg){
		log.writeLog("receive message from ci-runner process.")
		if(this.taskQueue.length <= 0){
			this.isWorking = false;
			return;
		}
		var nextTask = this.taskQueue.shift();
		this.runnerProcess.send(nextTask);
	}

	this.isWorking = true;
	var task = this.taskQueue.shift();
	if(!this.runnerProcess){
		this.runnerProcess = child_process.fork(__dirname + "/ciRunner.js");
		this.runnerProcess.on("message", execCB);
	}
	this.runnerProcess.send(task);
}
CITaskManager.prototype.addTask = function (task) {
	this.taskQueue.push(task);
	if(this.isRunning){
		return;
	}
	this.runTask();
}

module.exports = new CITaskManager();