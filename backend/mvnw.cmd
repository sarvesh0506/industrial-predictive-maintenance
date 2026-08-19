@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set MAVEN_CMD_LINE_ARGS=%*

if NOT "%JAVA_HOME%"=="" goto OkJHome
for %%i in (java.exe) do set "JAVACMD=%%~$PATH:i"
if not "%JAVACMD%"=="" goto checkName
echo Error: JAVA_HOME is not defined. 1>&2
goto error

:OkJHome
set "JAVACMD=%JAVA_HOME%\bin\java.exe"

:checkName
if not exist "%JAVACMD%" (
  echo Error: JAVA_HOME is set to an invalid directory. 1>&2
  goto error
)

:wrapper
set "WRAPPER_JAR=%~dp0\.mvn\wrapper\maven-wrapper.jar"
if exist "%WRAPPER_JAR%" goto run

echo Downloading Maven Wrapper...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar', '%WRAPPER_JAR%')"

:run
set "EXEC_DIR=%~dp0"
if "%EXEC_DIR:~-1%"=="\" set "EXEC_DIR=%EXEC_DIR:~0,-1%"
"%JAVACMD%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%EXEC_DIR%" "-Dmaven.home=%EXEC_DIR%\.mvn\wrapper" org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%
if ERRORLEVEL 1 goto error
goto end

:error
exit /b 1

:end
exit /b 0
