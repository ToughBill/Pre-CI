var fs = require('fs');

var filePath = 'C:\\TCSysTest\\timer.json';
var now = new Date();

if(fs.existsSync(filePath)) {
	var data = fs.readFileSync(filePath); // Example: {"Time": 123456, "Started": true, "ElapsedTime": 120}
	var timerObj = JSON.parse(data);
	
	if(timerObj.Started) {
		timerObj.Started = false; // Stop the timer
		timerObj.ElapsedTime = Math.floor((Math.abs(now.getTime() - timerObj.Time)) / 1000);
	}
	else {
		timerObj.Started = true; // Start the timer 
		timerObj.Time = now.getTime();
		timerObj.ElapsedTime = 0;
	}
	
	fs.writeFileSync(filePath, JSON.stringify(timerObj));
}
else {
	fs.writeFileSync(filePath, JSON.stringify({"Time": now.getTime(), "Started": true, "ElapsedTime": 0})); // Start timer
}

exports.GetDuration = function() {
	var data = fs.readFileSync(filePath); // Example: {"Time": 123456, "Started": true, "ElapsedTime": 120}
	var timerObj = JSON.parse(data);
	
	return timerObj.ElapsedTime;
}

exports.GetElapsedTimeFromDB = function() {
	/*var date = new Date();
	var year = date.getFullYear(); // Get year
	
	var file_name = 'db_report_' + year + '.json';
	var file_full_path = 'C:\\tc_trunk\\EmailReportHelper_CI\\DB\\' + file_name;
	
	var text = fs.readFileSync(file_full_path).toString(); // Read from file
	var jsonArray = JSON.parse(text); // Parse to JSON
	
	// get last execution result
	var elapsedTimeSeconds = jsonArray[jsonArray.length - 1].ElapsedTime;
	var result = calculateElapsedTime(elapsedTimeSeconds);
	
	return result;*/
	return 0;
}

function calculateElapsedTime(seconds) {
	var hours = Math.floor(seconds / (3600)); // Hours
	var minutes = Math.floor((seconds - (hours * 3600)) / 60); // Minutes
	var seconds = Math.floor(seconds - (hours * 3600) - (minutes * 60)); // seconds
	
	hours = hours < 10 ? "0" + hours : hours;
	minutes = minutes < 10 ? "0" + minutes : minutes;
	seconds = seconds < 10 ? "0" + seconds : seconds;
	
	return hours + ":" +  minutes + ":" + seconds;
}
