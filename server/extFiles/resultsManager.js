var fs = require('fs');
var parseString = require('xml2js').parseString;
var buildInfoManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\buildInfoManager.js')
var trendManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\trendManager.js');
var timeManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\timeManager.js');

var testSuite = [];
var testResultsJSON = [];

var subjectsData = getDataJSON("C:\\tc_trunk\\EmailReportHelper_CI\\subjects.json");
var knownDefectsData = getDataJSON("C:\\tc_trunk\\EmailReportHelper_CI\\knownDefects.json");
var expectedFailsData = getDataJSON("C:\\tc_trunk\\EmailReportHelper_CI\\expectedFails.json");

// Read the results XML file
var xml = fs.readFileSync('C:\\TCSysTest\\Results\\sanityResults.xml','utf8')

// Parse the XML to JSON format
parseString(xml, function (err, result) {
	testSuite = result.sanity.TestSuite;
	
	// Go over all tests in XML file and create array of JSON objects
	for (var i in testSuite) {
		for(var j in testSuite[i].Test) {
			testResultsJSON.push(getTestResultJSON(testSuite[i].Test[j], testSuite[i].$.name));
		}
	}
	if (err) console.log('Generate TestResults - Error occured');
	
	generateTestResults(testResultsJSON);
});

// Update JSON file with test results
function getTestResultJSON(test, suite) {
	var history = [];
	
	var jsonResultObj = 
	{
			'TestName' : test.$.name, 
			'Type' : test.$.type, 
			'Result' : test.result[0], 
			'Exception' : test.exception[0], 
			'Suite' : suite,
			'Browser' : setBrowserVersion(suite),
			'Subject' : getScriptSubject(test.$.name),
			'History' : history // "Trend" - array with 5 last execution results from the DB
			
	};
	
	// Negative tests verification
	jsonResultObj = verifyExpectedFails(jsonResultObj);
	
	// Known defects verification
	jsonResultObj = verifyKnownDefects(jsonResultObj);
	
	// Update trend field
	jsonResultObj.History = [jsonResultObj.Result];
	//jsonResultObj.History = trendManager.UpdateTrend(jsonResultObj.Suite, jsonResultObj.Type, jsonResultObj.TestName, jsonResultObj.Result);
	
	return jsonResultObj;
}

// Create test results file
function generateTestResults(testResultsArrayJSON) {

	var fail = 0;
	var pass = 0;
	var warning = 0;
	var buildNumber = buildInfoManager.GetBuildNumber();
	var elapsedTime = timeManager.GetDuration();
	var results = {};
	
	for(var i in testResultsArrayJSON) {
		switch(testResultsArrayJSON[i].Result) {
			case 'Pass':
				pass++;
				break;
			case 'Fail':
				fail++;
				break;
			case 'running':
				fail++;
				break;
			default:
				warning++;
				break;
		}
	}
	
	if (fs.existsSync('C:\\TCSysTest\\Results\\summaryResults.json')) {
		// Update
		results = getDataJSON('C:\\TCSysTest\\Results\\summaryResults.json'); // Example: {"Build": "12.01.2323.0", "Pass": 100, "Fail": 2, "Warning": 3, "ElapsedTime": 120};
		results.Pass += pass;
		results.Fail += fail;
		results.Warning += warning;
		results.ElapsedTime += elapsedTime;
	}
	else {
		// Create
		results = {"Build": buildNumber, "Pass": pass, "Fail": fail, "Warning": warning, "ElapsedTime": elapsedTime};
	}
	
	// Save
	fs.writeFileSync('C:\\TCSysTest\\Results\\summaryResults.json',JSON.stringify(results));
	saveExecutionResults(testResultsArrayJSON);
}

// Get JSON data
function getDataJSON(path) {
	var data = fs.readFileSync(path).toString();
	var json = JSON.parse(data);
	return json;
}

// Set Browser type
function setBrowserVersion(suiteType) { 
	if(suiteType == 'SysTest_FF_Interactive')
		return 'Firefox';
	else if(suiteType == 'SysTest_IE_Interactive')
		return 'IE';
	else if(suiteType == 'SysTest_Chrome')
		return 'Chrome';
	else if(suiteType == 'SysTest_ChromeLite')
		return 'ChromeLite';
}

// Set Subject type
function getScriptSubject(testName){	
	for(var i in subjectsData.Subjects){
		if(testName.indexOf(subjectsData.Subjects[i]) > -1){
			return subjectsData.Subjects[i];
		}
	}
	return 'Other';
}


// Negative test verification (update the test result if needed)
function verifyExpectedFails(jsonResultObj) {
	switch(jsonResultObj.Suite) {
		case 'SysTest_IE_Interactive':
			if(jsonResultObj.Type == 'replayScript' && jsonResultObj.Result == 'Fail'){
				for(var i in  expectedFailsData.ExpectedFailsIE) {
					if(expectedFailsData.ExpectedFailsIE[i].TestName == jsonResultObj.TestName && expectedFailsData.ExpectedFailsIE[i].Exception.replace(/[\s]/g, '') == jsonResultObj.Exception.replace(/[\s]/g, '')) {
						jsonResultObj.Result = 'Pass';
						jsonResultObj.Exception = 'Note: Negative testing...   ' + jsonResultObj.Exception;
					}
				}
			}
			break;
		case 'SysTest_FF_Interactive':
			if(jsonResultObj.Type == 'replayScript' && jsonResultObj.Result == 'Fail'){
				for(var i in  expectedFailsData.ExpectedFailsFF) {
					if(expectedFailsData.ExpectedFailsFF[i].TestName == jsonResultObj.TestName && expectedFailsData.ExpectedFailsFF[i].Exception.replace(/[\s]/g, '') == jsonResultObj.Exception.replace(/[\s]/g, '')) {
						jsonResultObj.Result = 'Pass';
						jsonResultObj.Exception = 'Note: Negative testing...   ' + jsonResultObj.Exception;
					}
				}
			}
			else if(jsonResultObj.Type == 'recordReplayScript' && jsonResultObj.Result == 'Fail'){
				for(var i in  expectedFailsData.ExpectedFailsFF) {
					if(expectedFailsData.ExpectedFailsFF[i].TestName == jsonResultObj.TestName && expectedFailsData.ExpectedFailsFF[i].Exception.replace(/[\s]/g, '') == jsonResultObj.Exception.replace(/[\s]/g, '')) {
						jsonResultObj.Result = 'Pass';
						jsonResultObj.Exception = 'Note: Negative testing...   ' + jsonResultObj.Exception;
					}
				}
			}
			break;
		case 'SysTest_Chrome':
			if(jsonResultObj.Type == 'replayScript' && jsonResultObj.Result == 'Fail'){
				for(var i in  expectedFailsData.ExpectedFailsChrome) {
					if(expectedFailsData.ExpectedFailsChrome[i].TestName == jsonResultObj.TestName && expectedFailsData.ExpectedFailsChrome[i].Exception.replace(/[\s]/g, '') == jsonResultObj.Exception.replace(/[\s]/g, '')) {
						jsonResultObj.Result = 'Pass';
						jsonResultObj.Exception = 'Note: Negative testing...   ' + jsonResultObj.Exception;
					}
				}
			}
			break;
		case 'SysTest_ChromeLite':
			if(jsonResultObj.Type == 'replayScript' && jsonResultObj.Result == 'Fail'){
				for(var i in  expectedFailsData.ExpectedFailsChrome) {
					if(expectedFailsData.ExpectedFailsChrome[i].TestName == jsonResultObj.TestName && expectedFailsData.ExpectedFailsChrome[i].Exception == jsonResultObj.Exception.replace(/["]/g,"&quot;").replace(/[']/g,"&apos;")) {
						jsonResultObj.Result = 'Pass';
						jsonResultObj.Exception = 'Note: Negative testing...   ' + jsonResultObj.Exception;
					}
				}
			}
			break;
		default:
			break;
	}
	
	return jsonResultObj;
}

// Known defects verification (update the test result if needed)
function verifyKnownDefects(resultObj) {
	if(resultObj.Result != 'Pass')
	{
		var knownDefectsArray = [];
		
		// Get all raised defects from JSON file by browser type 
		switch(resultObj.Suite) {
			case 'SysTest_IE_Interactive':
				knownDefectsArray = knownDefectsData.KnownDefectsIE;
				break;
			case 'SysTest_FF_Interactive':
				knownDefectsArray = knownDefectsData.KnownDefectsFF;
				break;
			case 'SysTest_Chrome':
				knownDefectsArray = knownDefectsData.KnownDefectsChrome;
				break;
			default:
				break;
		}
		
		// Go over all raised defects and fit to intended failure script 
		if(knownDefectsArray.length > 0) {
			for(var i in knownDefectsArray) {
				if(knownDefectsArray[i].TestName == resultObj.TestName && resultObj.Type == knownDefectsArray[i].Type) {
					resultObj.Result = "Warning";
					resultObj.Exception = "Defect: " + knownDefectsArray[i].Defect + " was raised in AGM";
					break;
				}
			}
		}
	}
	
	return resultObj;
}

// Save detailed results
function saveExecutionResults(resultsArr) {
	var arr = [];
	
	if(fs.existsSync('C:\\TCSysTest\\Results\\results.json')) {
		try {
			var data = fs.readFileSync('C:\\TCSysTest\\Results\\results.json');
			arr = JSON.parse(data);
		}
		catch(err) {
			arr = [];
		}
	}
	
	for(var i in resultsArr) {
		arr.push(resultsArr[i]);
	}
	
	fs.writeFileSync('C:\\TCSysTest\\Results\\results.json',JSON.stringify(arr));
}