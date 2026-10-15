@echo off
rem ============================================================================
rem  Maximum Tension - build the site
rem ----------------------------------------------------------------------------
rem  Makes the served copies at the root of the repository from src/:
rem  script.js, lang.js, pumpkin.js, zip.js, blackhole.js, js\*.js, style.css,
rem  index.html and 404.html. Same names, file headers kept, comments and
rem  whitespace removed, names not mangled (tools\build.js does the work).
rem
rem  Needs Node.js once:  winget install OpenJS.NodeJS.LTS
rem  The first run installs the two minifiers into tools\node_modules, at the
rem  exact versions in tools\package.json, so every build comes out the same.
rem
rem  Usage: double-click it, or run  tools\build.cmd
rem ============================================================================
setlocal

rem OPENED WITH A DOUBLE CLICK: KEEP THE WINDOW OPEN AT THE END TO READ IT
rem (DELAYED EXPANSION, SO QUOTES OR "&" IN THE PATHS CANNOT BREAK THE TEST)
setlocal EnableDelayedExpansion
set "LINE=!cmdcmdline!"
if defined LINE set "LINE=!LINE:"=!"
set "HOLD="
if defined LINE if /i not "!LINE:/c =!"=="!LINE!" set "HOLD=1"
endlocal & set "HOLD=%HOLD%"

set "TOOLS=%~dp0\WEBPACK"

node --version >nul 2>nul
if errorlevel 1 goto nonode

rem FIRST RUN (OR A NEW package.json): INSTALL THE MINIFIERS NEXT TO build.js
set "READY=1"
if not exist "%TOOLS%node_modules\terser\package.json" set "READY="
if not exist "%TOOLS%node_modules\html-minifier-terser\package.json" set "READY="
if defined READY goto build

echo Installing the minifiers, first run only ...
pushd "%TOOLS%"
rem npm IS A .cmd FILE ITSELF: WITHOUT "call" THIS SCRIPT WOULD END HERE
call npm install --no-audit --no-fund
set "INSTALLED=%errorlevel%"
popd
if not "%INSTALLED%"=="0" goto noinstall
echo.

:build
node "%TOOLS%build.js"
if errorlevel 1 goto broke
goto end

:nonode
echo Node.js was not found. Install it once with:  winget install OpenJS.NodeJS.LTS
echo then open a new terminal and run this again.
goto end

:noinstall
echo npm could not install the minifiers. Check the internet connection and
echo run this again.
goto end

:broke
echo.
echo The build stopped with an error, see above. Nothing else was changed.

:end
if defined HOLD pause
endlocal
