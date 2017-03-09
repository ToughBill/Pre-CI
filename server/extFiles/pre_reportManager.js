var fs = require('fs');
var nodemailer = require('nodemailer');
var timeManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\timeManager.js');
var buildInfoManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\BuildInfoManager.js');
var systemInfoManager = require('C:\\tc_trunk\\EmailReportHelper_CI\\SystemInfoManager.js');

var mailSubjectPrefix = 'TruClient CI ';
var reportTitle = 'TruClient CI Automation';

// create reusable transport method (opens pool of SMTP connections)
var transport = nodemailer.createTransport("SMTP", {
    host: "smtp3.hpe.com"
});

var pass = 0;
var fail = 0;
var warning = 0;

var flag_BackwardCompatibilityHeader = false;
var flag_JonesHeader = false;
var flag_TransactionsHeader = false;
var flag_EventHandlerHeader = false;
var flag_ToolBoxHeader = false;
var flag_JSApiHeader = false;
var flag_StepHeader = false;
var flag_FunctionHeader = false;
var flag_DescriptorHeader = false;
var flag_HTML5Header = false;
var flag_ElectorHeader = false;
var flag_RunlogicHeader = false;
var flag_ObjectHeader = false;
var flag_BrowserHeader = false;
var flag_OtherHeader = false;

var rowNumber_BackwardCompatibility = 1;
var rowNumber_Jones = 1;
var rowNumber_Transactions = 1;
var rowNumber_EventHandler = 1;
var rowNumber_ToolBox = 1;
var rowNumber_JSApi = 1;
var rowNumber_Step = 1;
var rowNumber_Function = 1;
var rowNumber_Descriptor = 1;
var rowNumber_HTML5 = 1;
var rowNumber_Elector = 1;
var rowNumber_Runlogic = 1;
var rowNumber_Object = 1;
var rowNumber_Browser = 1;
var rowNumber_Other = 1;

// Subtable Headers
var BackwardCompatibilityHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Backward Compatibility</b></font></td></tr>';
var JonesHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Jones</b></font></td></tr>';
var TransactionsHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Transactions</b></font></td></tr>';
var EventHandlerHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>EventHandler</b></font></td></tr>';
var ToolBoxHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>ToolBox</b></font></td></tr>';
var JSApiHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>JS API</b></font></td></tr>';
var StepHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Step Options</b></font></td></tr>';
var FunctionHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Function Library</b></font></td></tr>';
var DescriptorHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Descriptor</b></font></td></tr>';
var HTML5Header = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>HTML5</b></font></td></tr>';
var ElectorHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Electors</b></font></td></tr>';
var RunlogicHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Runlogic</b></font></td></tr>';
var ObjectHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Object</b></font></td></tr>';
var BrowserHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Browser</b></font></td></tr>';
var OtherHeader = '<tr style="background-color: #ffffff; padding-left:20px;"><td colspan="1" style="background-color: #4F81BD; class="header"><font face="Calibri" color="#FFFFFF"><b>Other</b></font></td></tr>';

// Get test execution detailed results
var dataDetailedResults = fs.readFileSync('C:\\TCSysTest\\Results\\results.json');
var resultsArrayJSON = JSON.parse(dataDetailedResults);

// Get test execution summary
var summaryJSON = getSummaryResults('C:\\TCSysTest\\Results\\summaryResults.json');

// Get test execution elapsed time
var elapsedTime = timeManager.GetElapsedTimeFromDB();

// Get build number
var buildNumber = summaryJSON.Build;

// Get environment information
var systemInfo = systemInfoManager.GetEnvironmentSpecifications();

// Get subscribers
var mailSubscribers = buildInfoManager.GetSubscribers();

// Test execution status
var status = summaryJSON.Fail == 0 ? true : false;

var statusSubject = status ? '*Successful*' : '*Fail*';

// Verify if RECORD script is exist
var isRecordScriptsExist = function () {
    for (var i in resultsArrayJSON) {
        if (resultsArrayJSON[i].Type === 'recordReplayScript')
            return true;
    }
    return false;
}

// Verify if REPLAY script is exist
var isReplayScriptsExist = function () {
    for (var i in resultsArrayJSON) {
        if (resultsArrayJSON[i].Type === 'replayScript')
            return true;
    }
    return false;
}

function SendEmailReport(resultsArrayJSON) {

    var html = getHeaderHTML();
    html = html + getBodyHTML(resultsArrayJSON);

    // setup e-mail data with unicode symbols
    var mailOptions = {
            from: "Pre-TC Automation <PreTCautomation@hpe.com>",
            to: process.argv[3], 
            //cc: mailSubscribers.CC, 
            subject: mailSubjectPrefix + statusSubject + ' [' + buildNumber + ' | ' + getMailSubject() + ']', // Subject line
            text: "", 
            html: html,   
            attachments: getAttachments()
        }

    // send mail with defined transport object
    transport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        transport.close(); // shut down the connection pool, no more messages
    });
}

function getAttachments() {
    // Color icons
    var result = [{
        filename: "reportChart.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\phantomjs\\reportChart.png', // Generated chart location
        cid: "unique@kreata.ee" //same cid value as in the html img src
    }, {
        filename: "passSmall.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\passSmall.png', // icon
        cid: "unique@kreata.ee_smallPass"
    }, {
        filename: "failSmall.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\failSmall.png', // icon
        cid: "unique@kreata.ee_smallFail"
    }, {
        filename: "warningSmall.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\warningSmall.png', // icon
        cid: "unique@kreata.ee_smallWarning"
    }, {
        filename: "IE_icon.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\IE_icon.png', // icon
        cid: "unique@kreata.ee_ie"
    }, {
        filename: "Firefox_icon.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\Firefox_icon.png', // icon
        cid: "unique@kreata.ee_firefox"
    }, {
        filename: "Chromium_icon.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\Chromium_icon.png', // icon
        cid: "unique@kreata.ee_chromium"
    }, {
        filename: "Chrome_icon.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\Chrome_icon.png', // icon
        cid: "unique@kreata.ee_chrome"
    }, {
        filename: "TruClient.png",
        filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\TruClient.png', // icon
        cid: "unique@kreata.ee_TruClient"
    }];

    // Black & White icons
    if (summaryJSON.Fail == 0)
        result.push({
            filename: "failSmallBW.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\failSmallBW.png',
            cid: "unique@kreata.ee_smallFailBW"
        });

    if (summaryJSON.Pass == 0)
        result.push({
            filename: "passSmallBW.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\passSmallBW.png',
            cid: "unique@kreata.ee_smallPassBW"
        });

    if (summaryJSON.Warning == 0)
        result.push({
            filename: "warningSmallBW.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\warningSmallBW.png',
            cid: "unique@kreata.ee_smallWarningBW"
        });

    // Duration time Increase/Decrease icons
    if (isDurationTimeIncreased()) {
        result.push({
            filename: "durationIncrease.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\durationIncrease.png',
            cid: "unique@kreata.ee_durationIncrease"
        });
    } else {
        result.push({
            filename: "durationDecrease.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\durationDecrease.png',
            cid: "unique@kreata.ee_durationDecrease"
        });
    }

    // Record/Replay icons
    if (isReplayScriptsExist) {
        result.push({
            filename: "replay_small.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\replay_small.png',
            cid: "unique@kreata.ee_replay"
        });
    }

    if (isRecordScriptsExist) {
        result.push({
            filename: "record_small.png",
            filePath: 'C:\\tc_trunk\\EmailReportHelper_CI\\icons\\record_small.png',
            cid: "unique@kreata.ee_record"
        });
    }

    return result;
}

// *********************************************************
// ************************ HEAD ***************************
// *********************************************************
function getHeaderHTML() {
    var now = new Date;

    var html = '<head>' +
        '<table width="100%"><tr>' +
        '<td style="white-space: nowrap"><font size="7" face="calibri" color="#0096D6">' + reportTitle + '</font></td>' +
        '<td style="white-space: nowrap"><img align="right" src="cid:unique@kreata.ee_TruClient" /></td>' +
        '</tr></table>' +
        '<hr><br>';


    html += '<table width="100%">' +
        '<tr><td style="white-space: nowrap"><font size="6" face="Calibri">Online Report Center</font></td></tr>' +
        '<tr><td><a href="http://myd-vm03063.hpeswlab.net:60000/view_ci/ci.html">http://myd-vm03063.hpeswlab.net:60000/view_ci/ci.html</a></td></tr>' +
        '</table>' +
        '<hr><br>';


    html += '<table width="100%">' +
        '<tr>' +
        '<td colspan="4" align="left" style="white-space: nowrap"><font size="6" face="Calibri">Execution Results</font></td>' +
        getExecutionStatusHTML(status) +
        '</tr>' +
        '<tr><td colspan="1"></td></tr>' +
        '<tr><font face="calibri">' +
        '<td width="25%" style="white-space: nowrap"><b>Date:</b> ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString() +
        '</br><b>Duration:</b> ' + elapsedTime + ' ' + showDurationActualStatus() +
        '</br><b>Build number:</b> ' + buildNumber +
        '</br><b>OS Name:</b> ' + systemInfo.OS +
        '</br><b>Browsers:</b> ' + systemInfo.IE + ' / ' + systemInfo.Firefox + ' / ' + systemInfo.Chromium + '/' + systemInfo.Chrome +
        '</br><b>Host Name:</b> ' + systemInfo.Host +
        '</br><b>Console logs:</b> ' +
        '<a href="\\\\' + systemInfo.Host + '.hpeswlab.net\\TC_Console_Logs\\' + buildNumber + '\\"' + ' style="text-decoration:none;">Replay & Console logs</a>' +
        '</br><b>Systest server logs:</b> ' +
        '<a href="\\\\' + systemInfo.Host + '.hpeswlab.net\\TC_Systest_Server_Logs\\' + buildNumber + '\\"' + ' style="text-decoration:none;">Systest server logs</a>' +
        '</br>' +
        '</br>' + getCommitterInfo() + '</td>' +
        getExecutionResultsTitle() +
        '</tr></font>' +
        '</table>' +
        '<hr>' +
        '</head>';

    return html;

}


function getExecutionStatusHTML(exeStatus) {
    if (exeStatus)
        return '<tr padding-bottom: "6px"><td colspan="1" align="left" style="white-space: nowrap"><font color="#00922A" size="6" face="Calibri"><b>Succeeded</b></font></td></tr>';
    else
        return '<tr padding-bottom: "6px"><td colspan="1" align="left" style="white-space: nowrap"><font color="#E00000" size="6" face="Calibri"><b>Failed</b></font></td></tr>';
}

function showDurationActualStatus() {
    if (isDurationTimeIncreased()) {
        return '<img src="cid:unique@kreata.ee_durationIncrease" />';
    } else {
        return '<img src="cid:unique@kreata.ee_durationDecrease" />';
    }
}

function getCommitterInfo() {
    //var committersArray = mailSubscribers.TO;
    var committersArray = [process.argv[3]];
    var result = '';

    if (committersArray.length > 1) {
        result += committersArray.length + ' commits by ' + committersArray[0];
        for (var i = 1; i < committersArray.length; i++) {
            result += ', ' + committersArray[i];
        }
    } else if (committersArray[0]) { // Not null or undefined
        result += '1 commit by ' + committersArray[0].toString() + '</td>'
    } else {
        result += 'No committers were found ...'
    }

    return result;
}

function getExecutionResultsTitle() {
    var result = '';

    // Fail
    if (summaryJSON.Fail > 0)
    // Color
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#E00000" face="calibri">' + summaryJSON.Fail + '</font></br><img src="cid:unique@kreata.ee_smallFail" alt="Fail" />&nbsp<font face="calibri" color="#989898">Tests Failed</font></td>';
    else
    // Black & White
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#00922A" face="calibri">' + summaryJSON.Fail + '</font></br><img src="cid:unique@kreata.ee_smallFailBW" alt="Fail" />&nbsp<font face="calibri" color="#989898">Tests Failed</font></td>';

    // Warning
    if (summaryJSON.Warning > 0)
    // Color
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#FED634" face="calibri">' + summaryJSON.Warning + '</font></br><img src="cid:unique@kreata.ee_smallWarning" alt="Pass" />&nbsp<font face="calibri" color="#989898">Warnings</font></td>';
    else
    // Black & White
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#00922A" face="calibri">' + summaryJSON.Warning + '</font></br><img src="cid:unique@kreata.ee_smallWarningBW" alt="Pass" />&nbsp<font face="calibri" color="#989898">Warnings</font></td>';

    //Pass
    if (summaryJSON.Pass > 0)
    // Color
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#00922A" face="calibri">' + summaryJSON.Pass + '</font></br><img src="cid:unique@kreata.ee_smallPass" alt="Pass" />&nbsp<font face="calibri" color="#989898">Tests Passed</font></td>';
    else
    // Black & White
        result += '<td width="25%" align="center" style="white-space: nowrap"><font size="7" color="#989898" face="calibri">' + summaryJSON.Pass + '</font></br><img src="cid:unique@kreata.ee_smallPassBW" alt="Pass" />&nbsp<font face="calibri" color="#989898">Tests Passed</font></td>';

    return result;
}


// *******************************************************
// *********************** BODY **************************
// *******************************************************
function getBodyHTML(resultsArrayJSON) {
    var result = createReportTable(resultsArrayJSON);

    var html = '<body>' +
        '<br>' +
        '<div align="left"><font size="6" face="Calibri">Results History</font></div>' +
        '<br>' +
        '<p><div align="center"><img src="cid:unique@kreata.ee"/></div></p>';

    if (!status) {
        html += '<hr><br><div align="left"><font size="6" color="#FF0000" face="Calibri">Failed Scripts</font></div></br>';
        html += result.tableFailed;
        html += '</br><hr></br>';
    };

    //html += '<div align="left"><font size="6" face="Calibri">Execution Detail Report</font></div></br>';
    //html += result.table;
    html += '</body>';

    return html;
}

function createReportTable(testResultsArrayJSON) {

    // This is a table which can display the failed scripts side by side
    var tableFailed = '<div align="center"><table id="tbFailed">';
    tableFailed += '<thead><tr style="background-color: #FFFFFF; padding-bottom: 6px"><th colspan="1" align="left"><img src="cid:unique@kreata.ee_smallFail" alt="Fail" />&nbsp;<font face="Calibri"> - Script execution failed</font></th></tr></thead>'
    tableFailed += '<thead>';
    tableFailed += '<tr><font face="Calibri" color="#FFFFFF">';
    tableFailed += '<th width="400" style="background-color: #0F407C;">Test Name</th>';
    tableFailed += '<th width="100" style="background-color: #0F407C;">Status</th>';
    tableFailed += '<th width="100" style="background-color: #0F407C;">Trend</th>';
    tableFailed += '<th width="100" style="background-color: #0F407C;">Type</th>';
    tableFailed += '<th width="200" style="background-color: #0F407C;">Browser</th>';
    tableFailed += '<th width="500" style="background-color: #0F407C;">Exception</th>';
    tableFailed += '</font></tr>';
    tableFailed += '</thead>';
    tableFailed += '<tbody>';

    // This is the detailed result table
    var table = '<div align="center"><table id="tblResults">';

    // Labels
    table += '<thead><tr style="background-color: #FFFFFF; padding-bottom: 6px"><th colspan="1" align="left"><img src="cid:unique@kreata.ee_smallPass" alt="Pass" />&nbsp;<font face="Calibri"> - Script execution passed</font></th></tr></thead>'
    table += '<thead><tr style="background-color: #FFFFFF; padding-bottom: 6px"><th colspan="1" align="left"><img src="cid:unique@kreata.ee_smallFail" alt="Fail" />&nbsp;<font face="Calibri"> - Script execution failed</font></th></tr></thead>'
    table += '<thead><tr style="background-color: #FFFFFF; padding-bottom: 6px"><th colspan="1" align="left"><img src="cid:unique@kreata.ee_smallWarning" alt="Warning" />&nbsp;<font face="Calibri"> - Script execution interrupted</font></th></tr></thead>'
    table += '<thead><tr style="background-color: #FFFFFF; padding-bottom: 6px"><th colspan="6" align="left"></th></tr></thead>'

    // Table Header
    table = table + '<thead>';
    table = table + '<tr><font face="Calibri" color="#FFFFFF">';
    table = table + '<th width="400" style="background-color: #0F407C;">Test Name</th>';
    table = table + '<th width="100" style="background-color: #0F407C;">Status</th>';
    table = table + '<th width="100" style="background-color: #0F407C;">Trend</th>';
    table = table + '<th width="100" style="background-color: #0F407C;">Type</th>';
    table = table + '<th width="200" style="background-color: #0F407C;">Browser</th>';
    table = table + '<th width="500" style="background-color: #0F407C;">Exception</th>';
    table = table + '</font></tr>';
    table = table + '</thead>';

    // Table body
    table = table + '<tbody>';

    for (var i = 0; i < testResultsArrayJSON.length; i++) { // Array of JSON objects

        // Construct the failed script body
        if (testResultsArrayJSON[i].Result === "Fail") {
            tableFailed += getResultsTableRow(testResultsArrayJSON[i]);
        }

        // Subject options
        switch (testResultsArrayJSON[i].Subject) {
            case 'Backward_Compatibility':
                flag_BackwardCompatibilityHeader = true;
                BackwardCompatibilityHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_BackwardCompatibility += 1;
                break;
            case 'Jones':
                flag_JonesHeader = true;
                JonesHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Jones += 1;
                break;
            case 'Transactions':
                flag_TransactionsHeader = true;
                TransactionsHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Transactions += 1;
                break;
            case 'EventHandler':
                flag_EventHandlerHeader = true;
                EventHandlerHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_EventHandler += 1;
                break;
            case 'ToolBox':
                flag_ToolBoxHeader = true;
                ToolBoxHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_ToolBox += 1;
                break;
            case 'JSApi':
                flag_JSApiHeader = true;
                JSApiHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_JSApi += 1;
                break;
            case 'Step':
                flag_StepHeader = true;
                StepHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Step += 1;
                break;
            case 'Function':
                flag_FunctionHeader = true;
                FunctionHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Function += 1;
                break;
            case 'Descriptor':
                flag_DescriptorHeader = true;
                DescriptorHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Descriptor += 1;
                break;
            case 'Elector':
                flag_ElectorHeader = true;
                ElectorHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Elector += 1;
                break;
            case 'HTML5':
                flag_HTML5Header = true;
                HTML5Header += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_HTML5 += 1;
                break;
            case 'Runlogic':
                flag_RunlogicHeader = true;
                RunlogicHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Runlogic += 1;
                break;
            case 'Object':
                flag_ObjectHeader = true;
                ObjectHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Object += 1;
                break;
            case 'Browser':
                flag_BrowserHeader = true;
                BrowserHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Browser += 1;
                break;
            default:
                flag_OtherHeader = true;
                OtherHeader += getResultsTableRow(testResultsArrayJSON[i]);
                rowNumber_Other += 1;
                break;
        }
    }

    // Close the failed script table
    tableFailed += '</tbody></table></div>'

    // Accumulate all sub-tables together
    if (flag_BackwardCompatibilityHeader)
        table += BackwardCompatibilityHeader;
    if (flag_JonesHeader)
        table += JonesHeader;
    if (flag_TransactionsHeader)
        table += TransactionsHeader;
    if (flag_EventHandlerHeader)
        table += EventHandlerHeader;
    if (flag_ToolBoxHeader)
        table += ToolBoxHeader;
    if (flag_JSApiHeader)
        table += JSApiHeader;
    if (flag_StepHeader)
        table += StepHeader;
    if (flag_FunctionHeader)
        table += FunctionHeader;
    if (flag_DescriptorHeader)
        table += DescriptorHeader;
    if (flag_ElectorHeader)
        table += ElectorHeader;
    if (flag_HTML5Header)
        table += HTML5Header;
    if (flag_RunlogicHeader)
        table += RunlogicHeader;
    if (flag_ObjectHeader)
        table += ObjectHeader;
    if (flag_BrowserHeader)
        table += BrowserHeader;
    if (flag_OtherHeader)
        table += OtherHeader;

    // Close table body
    table = table + '</tbody>';

    // Table footer
    table = table + '</table></div>';

    return {
        'tableFailed': tableFailed,
        'table': table
    };
}

// Create new Table Row using JSON object
function getResultsTableRow(testResultsJSON) {

    var tableRow = '';

    // Script path on rubicon server
    var scriptPath = '\\\\mydastr01.hpeswlab.net\\products\\TCS\\TCS\\win32_release\\' + buildNumber + '\\TC_DevTests\\Scripts\\CI\\' + ((testResultsJSON.Type === 'replayScript') ? 'Replay\\' : 'Record\\') + testResultsJSON.Browser + '\\' + testResultsJSON.TestName;

    // Define row background-color
    switch (testResultsJSON.Subject) {
        case 'Backward_Compatibility':
            if (rowNumber_BackwardCompatibility % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Jones':
            if (rowNumber_Jones % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Transactions':
            if (rowNumber_Transactions % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'EventHandler':
            if (rowNumber_EventHandler % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'ToolBox':
            if (rowNumber_ToolBox % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'JSApi':
            if (rowNumber_JSApi % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Step':
            if (rowNumber_Step % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Function':
            if (rowNumber_Function % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Descriptor':
            if (rowNumber_Descriptor % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Elector':
            if (rowNumber_Elector % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'HTML5':
            if (rowNumber_HTML5 % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Runlogic':
            if (rowNumber_Runlogic % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Object':
            if (rowNumber_Object % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        case 'Browser':
            if (rowNumber_Browser % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
        default:
            if (rowNumber_Other % 2 == 0)
                tableRow = '<tr style="background-color: #E9EDF4; padding-bottom: 8px"><font face="Calibri">'; // Even
            else
                tableRow = '<tr style="background-color: #D0D8E8; padding-bottom: 8px"><font face="Calibri">'; // Odd
            break;
    }

    // Test Name
    tableRow = tableRow + '<td style="padding-left:20px; white-space: nowrap;"><a href="' + scriptPath + '">' + testResultsJSON.TestName + '</a></td>'; // Test Name

    // Status
    switch (testResultsJSON.Result) {
        case 'Pass':
            tableRow = tableRow + '<td align="center" style="background-color: #99FF99; white-space: nowrap;">' + testResultsJSON.Result + '</td>'; // Pass
            pass++;
            break;
        case 'Warning':
            //case 'running':
            //case 'pending':
            tableRow = tableRow + '<td align="center" style="background-color: #F3F781; white-space: nowrap;">' + testResultsJSON.Result + '</td>'; // Warning
            warning++;
            break;
        case 'Fail':
        case 'running':
        case 'pending':
        default:
            tableRow = tableRow + '<td align="center" style="background-color: #FFCCCC; white-space: nowrap;">' + testResultsJSON.Result + '</td>'; // Fail
            fail++;
            break;
    }

    // Trend
    tableRow = tableRow + '<td align="center" style="white-space: nowrap;">';
    for (var i in testResultsJSON.History) {
        switch (testResultsJSON.History[i]) {
            case 'Pass':
                tableRow = tableRow + '<img src="cid:unique@kreata.ee_smallPass" alt="Pass" />&nbsp';
                break;
            case 'Fail':
                tableRow = tableRow + '<img src="cid:unique@kreata.ee_smallFail" alt="Fail" />&nbsp';
                break;
            case 'running':
                tableRow = tableRow + '<img src="cid:unique@kreata.ee_smallFail" alt="Fail" />&nbsp';
                break;
            default:
                tableRow = tableRow + '<img src="cid:unique@kreata.ee_smallWarning" alt="Warning" />&nbsp';
                break;
        }
    }
    tableRow = tableRow + '</td>'

    // Type
    switch (testResultsJSON.Type) {
        case 'replayScript':
            tableRow = tableRow + '<td align="center" style="white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_replay" />&nbsp' + 'Replay' + '</td>'; // Replay
            break;
        case 'recordReplayScript':
            tableRow = tableRow + '<td align="center" style="white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_record" />&nbsp' + 'Record' + '</td>'; // Record
            break;
        default:
            break;
    }

    // Browser
    if (testResultsJSON.Browser.indexOf('IE') != -1)
        tableRow = tableRow + '<td style="padding-left:20px; white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_ie" alt="IE" />&nbsp' + testResultsJSON.Browser + '</td>';
    else if (testResultsJSON.Browser.indexOf('Firefox') != -1)
        tableRow = tableRow + '<td style="padding-left:20px; white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_firefox" alt="Firefox" />&nbsp' + testResultsJSON.Browser + '</td>';
    else if (testResultsJSON.Browser.indexOf('Chrome') != -1)
        tableRow = tableRow + '<td style="padding-left:20px; white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_chromium" alt="Chrome" />&nbsp' + testResultsJSON.Browser + '</td>';
    else if (testResultsJSON.Browser.indexOf('ChromeLite') != -1)
        tableRow = tableRow + '<td style="padding-left:20px; white-space: nowrap;">' + '<img src="cid:unique@kreata.ee_chrome" alt="ChromeLite" />&nbsp' + testResultsJSON.Browser + '</td>';

    // Exception
    tableRow = tableRow + '<td align="center">' + testResultsJSON.Exception + '</td>'; // Exceptions
    tableRow = tableRow + '</font></tr>';
    return tableRow;
}

function getSummaryResults(path) {
    var data = fs.readFileSync(path);
    var summaryResults = JSON.parse(data);

    return {
        "Pass": summaryResults.Pass,
        "Fail": summaryResults.Fail,
        "Warning": summaryResults.Warning,
        "ElapsedTime": summaryResults.ElapsedTime,
        "Build": summaryResults.Build
    };
}

function isDurationTimeIncreased() {
    /*var date = new Date();
    var previousDurationTime = 0;
    var currentDurationTime = 0;

    var file_name = 'db_report_' + date.getFullYear() + '.json';
    var file_full_path = 'C:\\tc_trunk\\emailReportHelper_CI\\DB\\' + file_name;

    var text = fs.readFileSync(file_full_path).toString(); // Read file
    var jsonArray = JSON.parse(text); // Parse to JSON

    // get last execution result
    if (jsonArray.length > 1) {
        // At first, calculate the previous duration time
        previousDurationTime = jsonArray[jsonArray.length - 2].ElapsedTime;
        // At second, calculate the current duration time
        currentDurationTime = jsonArray[jsonArray.length - 1].ElapsedTime;
    }

    // Compare both previous and current duration times
    if (previousDurationTime < currentDurationTime)
        return true;
    else*/
        return false;
}

function getMailSubject() {
    var result = '';
    var ie = systemInfo.IE.split(' ');
    var ff = systemInfo.Firefox.split(' ');
    var chromium = systemInfo.Chromium.split(' ');
    var chrome = systemInfo.Chrome.split(' ');

    if (systemInfo.OS.indexOf('Windows 7') != -1) {
        result = 'Win7 | ' + 'IE' + ie[ie.length - 1] + ' | FF' + ff[ff.length - 1] + ' | ' + chromium[0] + chromium[1] + ' | Chrome' + chrome[chrome.length - 1];
    } else if (systemInfo.OS.indexOf('Windows 8.1') != -1) {
        result = 'Win8.1 | ' + 'IE' + ie[ie.length - 1] + ' | FF' + ff[ff.length - 1] + ' | ' + chromium[0] + chromium[1] + ' | Chrome' + chrome[chrome.length - 1];
    } else if (systemInfo.OS.indexOf('Windows 8') != -1) {
        result = 'Win8 | ' + 'IE' + ie[ie.length - 1] + ' | FF' + ff[ff.length - 1] + ' | ' + chromium[0] + chromium[1] + ' | Chrome' + chrome[chrome.length - 1];
    } else if (systemInfo.OS.indexOf('Windows Server 2008 R2') != -1) {
        result = 'Win Server 2K8 R2 | ' + 'IE' + ie[ie.length - 1] + ' | FF' + ff[ff.length - 1] + ' | ' + chromium[0] + chromium[1] + ' | Chrome' + chrome[chrome.length - 1];
    } else if (systemInfo.OS.indexOf('Windows Server 2012 R2') != -1) {
        result = 'Win Server 2012 R2 | ' + 'IE' + ie[ie.length - 1] + ' | FF' + ff[ff.length - 1] + ' | ' + chromium[0] + chromium[1] + ' | Chrome' + chrome[chrome.length - 1];
    }

    return result;

}

SendEmailReport(resultsArrayJSON);
