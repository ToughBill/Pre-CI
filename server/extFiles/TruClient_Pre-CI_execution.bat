@echo off
REM *****************************************************************************
REM ************************ TruClient CI work flow*******************************
REM *****************************************************************************

REM Save current build number locally
echo -1>C:\TC_Build_Number.txt
set build_number=-1

REM Mapping mydastr01/mydstore001 drivers (Pay attention between User Name and Password exist space)
REM set storage_server_user=hpeswlab\alm_truclient_auto W3lcome1
REM set production_server_user=emea\$lrauto001 lap.pit.sun-661
REM set variables=/persistent:yes

REM Map network drivers
REM net use * /delete /y
REM net use P: \\mydastr01.hpeswlab.net\products /user:%production_server_user% %variables%
REM net use T: \\mydstore01.hpeswlab.net\hpeswlab\ALM\TruClient\Automation /user:%storage_server_user% %variables%

REM *****************************************************************************
REM *********************** Create SysTest environment **************************
REM *****************************************************************************
set tc_trunk=C:\tc_trunk
set tc_systest=C:\TCSysTest
set log_path=c:\tc_Console_logs\
set emailReportHelper_CI=%tc_trunk%\EmailReportHelper_CI
set host=%COMPUTERNAME%

if exist "%tc_trunk%" rmdir /S /Q %tc_trunk% || goto :err
if not exist "%tc_trunk%" mkdir "%tc_trunk%" || goto :err
if exist %tc_systest% rmdir /S /Q %tc_systest% || goto :err

xcopy %1\build %tc_trunk%\build\ /S /Y /D  || goto :err
cmd /c %1\app\Extensions\DevTools\SysTest\CreateSysTest.bat

REM *****************************************************************************
REM ******************** Collect Environment Specification **********************
REM *****************************************************************************

REM Get version of IE browser
Set RegQry="HKLM\Software\Microsoft\Internet Explorer"
REG.exe Query %RegQry% | Find /i "svcVersion" > C:\version.txt

REM Get name and version of OS
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" >> C:\version.txt


REM Copy E-mail report helper
if exist "%emailReportHelper_CI%" rmdir /S /Q %emailReportHelper_CI% || goto :errCopyEmailReportHelper_CI
if not exist "%emailReportHelper_CI%" mkdir "%emailReportHelper_CI%" || goto :errCopyEmailReportHelper_CI

xcopy %1\TC_DevTests\app\RnRHelper\Common %emailReportHelper_CI% /E /Y || goto :errCopyemailReportHelper_CI
xcopy %1\TC_DevTests\app\RnRHelper\CI %emailReportHelper_CI% /E /Y || goto :errCopyemailReportHelper_CI

REM Copy DB
if exist %EmailReportHelper_CI%\DB rmdir /S /Q %EmailReportHelper_CI%\DB
if not exist %EmailReportHelper_CI%\DB mkdir %EmailReportHelper_CI%\DB

REM xcopy T:\DB\CI\%host% %EmailReportHelper_CI%\DB /E /Y /D || goto :errCopyUpdatedDB

REM Create new empty directory for log files
node %emailReportHelper_CI%\logsManager.js

REM Reset start time in startTime.json
node %emailReportHelper_CI%\startTimeManager.js


REM *****************************************************************************
REM ***************************** Script Execution ******************************
REM *****************************************************************************

	REM ******************************* Chromium Scripts *******************************

	set SysTest_Chrome_replayScript=%tc_systest%\Scripts\SysTest_Chrome\replayScript

	if exist "%SysTest_Chrome_replayScript%" rmdir /S /Q %SysTest_Chrome_replayScript% || goto :errCopyChromeScripts
	if not exist "%SysTest_Chrome_replayScript%" mkdir "%SysTest_Chrome_replayScript%" || goto :errCopyChromeScripts

	xcopy %1\TC_DevTests\Scripts\CI\Replay\Common %SysTest_Chrome_replayScript% /S /Y /D || goto :errCopyChromeScripts
	xcopy %1\TC_DevTests\Scripts\CI\Replay\Chrome %SysTest_Chrome_replayScript% /S /Y /D || goto :errCopyChromeScripts

	REM ignore below scriptsq
	if exist %SysTest_Chrome_replayScript%\javascript_variables_defined_init_negative rmdir /S /Q %SysTest_Chrome_replayScript%\javascript_variables_defined_init_negative

	node %emailReportHelper_CI%\timeManager.js
	node %tc_systest%\Server\node_modules\truclient\bin\systest_server.js > C:\TC_Systest_Server_Logs\systest_server.log
	node %emailReportHelper_CI%\resultsManager.js
	node %emailReportHelper_CI%\timeManager.js

	REM Copy all log files into directory
	node %emailReportHelper_CI%\logsManager.js Chrome

	REM copy Chromium snapshot for each steps
	REM call :copy_snapshot %SysTest_Chrome_replayScript% Chromium Chrome

	if exist "%SysTest_Chrome_replayScript%" rmdir /S /Q %SysTest_Chrome_replayScript% || goto :errCopyChromeScripts


	REM ******************************* FireFox Scripts *****************************

	set SysTest_FF_Interactive_replayScript=%tc_systest%\Scripts\SysTest_FF_Interactive\replayScript
	set SysTest_FF_Interactive_recordReplayScript=%tc_systest%\Scripts\SysTest_FF_Interactive\recordReplayScript

	if exist "%SysTest_FF_Interactive_replayScript%" rmdir /S /Q %SysTest_FF_Interactive_replayScript% || goto :errCopyFFscripts
	if not exist "%SysTest_FF_Interactive_replayScript%" mkdir "%SysTest_FF_Interactive_replayScript%" || goto :errCopyFFscripts

	if exist "%SysTest_FF_Interactive_recordReplayScript%" rmdir /S /Q %SysTest_FF_Interactive_recordReplayScript% || goto :errCopyFFscripts
	if not exist "%SysTest_FF_Interactive_recordReplayScript%" mkdir "%SysTest_FF_Interactive_recordReplayScript%" || goto :errCopyFFscripts

	xcopy %1\TC_DevTests\Scripts\CI\Replay\Common %SysTest_FF_Interactive_replayScript% /S /Y /D || goto :errCopyFFscripts
	xcopy %1\TC_DevTests\Scripts\CI\Replay\Firefox %SysTest_FF_Interactive_replayScript% /S /Y /D || goto :errCopyFFscripts
	xcopy %1\TC_DevTests\Scripts\CI\Record\Firefox %SysTest_FF_Interactive_recordReplayScript% /S /Y /D || goto :errCopyFFscripts

	REM ignore below scriptsq
	if exist %SysTest_FF_Interactive_replayScript%\javascript_variables_defined_init_negative rmdir /S /Q  %SysTest_FF_Interactive_replayScript%\javascript_variables_defined_init_negative

	node %emailReportHelper_CI%\timeManager.js
	node %tc_systest%\Server\node_modules\truclient\bin\systest_server.js > C:\TC_Systest_Server_Logs\systest_server.log
	node %emailReportHelper_CI%\resultsManager.js
	node %emailReportHelper_CI%\timeManager.js

	REM Copy all log files into directory
	node %emailReportHelper_CI%\logsManager.js Firefox

	REM call :copy_snapshot %SysTest_FF_Interactive_replayScript% Firefox Firefox
	REM call :copy_snapshot %SysTest_FF_Interactive_recordReplayScript% Firefox Firefox

	if exist "%SysTest_FF_Interactive_replayScript%" rmdir /S /Q %SysTest_FF_Interactive_replayScript% || goto :errCopyFFscripts
	if exist "%SysTest_FF_Interactive_recordReplayScript%" rmdir /S /Q %SysTest_FF_Interactive_recordReplayScript% || goto :errCopyFFscripts


	REM ******************************* IE Scripts **********************************

	set SysTest_IE_Interactive_replayScript=%tc_systest%\Scripts\SysTest_IE_Interactive\replayScript

	if exist "%SysTest_IE_Interactive_replayScript%" rmdir /S /Q %SysTest_IE_Interactive_replayScript% || goto :errCopyIEscripts
	if not exist "%SysTest_IE_Interactive_replayScript%" mkdir "%SysTest_IE_Interactive_replayScript%" || goto :errCopyIEscripts

	xcopy %1\TC_DevTests\Scripts\CI\Replay\Common %SysTest_IE_Interactive_replayScript% /S /Y /D || goto :errCopyIEscripts
	xcopy %1\TC_DevTests\Scripts\CI\Replay\IE %SysTest_IE_Interactive_replayScript% /S /Y /D || goto :errCopyIEscripts

	REM ignore below scripts
	if exist %SysTest_IE_Interactive_replayScript%\DragAndDrop_ProxyElement rmdir /S /Q %SysTest_IE_Interactive_replayScript%\DragAndDrop_ProxyElement
	if exist %SysTest_IE_Interactive_replayScript%\Check_EndEvent_ForAllSteps rmdir /S /Q %SysTest_IE_Interactive_replayScript%\Check_EndEvent_ForAllSteps
	if exist %SysTest_IE_Interactive_replayScript%\JSApi_AutoFilter rmdir /S /Q %SysTest_IE_Interactive_replayScript%\JSApi_AutoFilter
	if exist "%SysTest_IE_Interactive_replayScript%\Function Arg OptioneqTrue" rmdir /S /Q "%SysTest_IE_Interactive_replayScript%\Function Arg OptioneqTrue"
	if exist "%SysTest_IE_Interactive_replayScript%\Function Arg OptioneqFalse" rmdir /S /Q "%SysTest_IE_Interactive_replayScript%\Function Arg OptioneqFalse"

	if exist %SysTest_IE_Interactive_replayScript%\javascript_variables_defined_init_negative rmdir /S /Q  %SysTest_IE_Interactive_replayScript%\javascript_variables_defined_init_negative

	node %emailReportHelper_CI%\timeManager.js
	node %tc_systest%\Server\node_modules\truclient\bin\systest_server.js > C:\TC_Systest_Server_Logs\systest_server.log
	node %emailReportHelper_CI%\resultsManager.js
	node %emailReportHelper_CI%\timeManager.js

	REM Copy all log files into directory
	node %emailReportHelper_CI%\logsManager.js IE

	REM call :copy_snapshot %SysTest_IE_Interactive_replayScript% IE IE

	if exist "%SysTest_IE_Interactive_replayScript%" rmdir /S /Q %SysTest_IE_Interactive_replayScript% || goto :errCopyIEscripts

	
	REM ******************************* Chrome Lite Scripts *******************************

	set SysTest_Chrome_replayScript=%tc_systest%\Scripts\SysTest_ChromeLite\replayScript

	if exist "%SysTest_Chrome_replayScript%" rmdir /S /Q %SysTest_Chrome_replayScript% || goto :errCopyChromeLiteScripts

	if not exist "%SysTest_Chrome_replayScript%" mkdir "%SysTest_Chrome_replayScript%" || goto :errCopyChromeLiteScripts

	xcopy %1\TC_DevTests\Scripts\CI\Replay\ChromeLite %SysTest_Chrome_replayScript% /S /Y /D || goto :errCopyChromeLiteScripts

	node %emailReportHelper_CI%\timeManager.js
	if not exist "C:\TC_Systest_Server_Logs" mkdir "C:\TC_Systest_Server_Logs" || goto :errCopyChromeLiteScripts
	node %tc_systest%\Server\node_modules\truclient\bin\systest_server.js SysTest4Lite > C:\TC_Systest_Server_Logs\systest_server.log
	node %emailReportHelper_CI%\resultsManager.js
	node %emailReportHelper_CI%\timeManager.js

	REM Copy all log files into directory
	node %emailReportHelper_CI%\logsManager.js Chrome

	REM copy Chromium snapshot for each steps
	REM call :copy_snapshot %SysTest_Chrome_replayScript% Chromium Chrome

	if exist "%SysTest_Chrome_replayScript%" rmdir /S /Q %SysTest_Chrome_replayScript% || goto :errCopyChromeLiteScripts
	

REM *****************************************************************************
REM ***************************** Send E-mail ***********************************
REM *****************************************************************************

REM Update DB file
REM node %emailReportHelper_CI%\dbManager.js

@echo ****  prepare chart  ****
REM Create new chart results (using PhantomJS)
REM pushd %emailReportHelper_CI%\phantomjs
REM phantomjs %emailReportHelper_CI%\chartManager.js
REM popd

@echo ****  send email  ****
REM Send report to subscribers
node %emailReportHelper_CI%\pre_reportManager.js CI %2

REM Copy edited DB folder to shared storage
REM if not exist T:\ net use T: \\mydstore01.hpeswlab.net\hpeswlab\ALM\TruClient\Automation /user:%storage_server_user% %variables%
REM xcopy %emailReportHelper_CI%\DB T:\DB\CI\%host% /E /Y /D || goto :errCopyUpdatedDB

REM import result to DB
REM node %emailReportHelper_CI%\report.js CI

REM Kill all tasks if exist
taskkill /im "firefox.exe" /f /t
taskkill /im "TcWebIELauncher.exe" /f /t
taskkill /im "chrome.exe" /f /t
taskkill /im "iexplore.exe" /f /t
rem taskkill /im "cdb.exe" /f /t
rem taskkill /im "crashreporter.exe" /f /t
rem taskkill /im "node.exe" /f /t

exit

rem **************************************************************************************
rem ************************** Backup script snapshot ************************************
rem **************************************************************************************
:copy_snapshot
pushd %1
REM for /d %%i in (*) do if exist "%1\%%i\results\interactive\%2\Run Block" robocopy "%1\%%i\results\interactive\%2\Run Block" %log_path%%build_number%\%3\%%i_snapshots /copyall /s
popd
goto :end

:err
echo The error has occured when copied TruClient build from mydastr01 server
COLOR 4

:errCopyFFscripts
echo The error has occured when copied SysTest_FF_Interactive_replayScript/SysTest_FF_Interactive_recordReplayScript files from mydastr01 server
COLOR 4

:errCopyIEscripts
echo The error has occured when copied SysTest_IE_Interactive_replayScript files from mydastr01 server
COLOR 4

:errCopyChromeScripts
echo The error has occured when copied SysTest_Chrome_replayScript files from mydastr01 server
COLOR 4

:errCopyChromeLiteScripts
echo The error has occured when copied SysTest_ChromeLite_replayScript files from mydastr01 server
COLOR 4

:errCopyEmailReportHelper_CI
echo The error has occured when copied emailReportHelper_CI folder
COLOR 4

:errCopyUpdatedDB
echo The error has occured when copied DB folder to shared storage
COLOR 4

:errCopyFFSnapshot
echo The error has occured when copied the snapshots for TruClient FF
color 4

:end
