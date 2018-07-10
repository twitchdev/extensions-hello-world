@ECHO OFF
SETLOCAL

SET T=%TEMP%\%RANDOM%.cnf
SET GIT=%ProgramFiles%\Git
SET CONF=%~dp0..\conf
SET FILE_ROOT=%CONF%\%~1

IF EXIST "%CONF%" RD /Q /S "%CONF%"
MKDIR "%CONF%"
COPY /Y "%GIT%\usr\ssl\openssl.cnf" %T% > nul
ECHO [SAN]>> %T%
ECHO subjectAltName='DNS:localhost'>> %T%
"%GIT%\mingw64\bin\openssl" req -newkey rsa:4096 -days 1001 -nodes -x509 -subj "/C=US/ST=California/L=San Francisco/O=LULZCorp/OU=web/CN=localhost" -extensions SAN -config "%T%" -keyout "%FILE_ROOT%.key" -out "%FILE_ROOT%.crt"

SET EXIT_CODE=%ERRORLEVEL%
DEL /F /Q %T%
EXIT /B %EXIT_CODE%
