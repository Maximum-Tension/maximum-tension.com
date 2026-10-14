@echo off
rem ============================================================================
rem  Maximum Tension - shrink rendered background videos for the site
rem ----------------------------------------------------------------------------
rem  Turns each big render into the two small MP4 files the site plays, in the
rem  videos folder. The name comes from the file itself, minus its size:
rem
rem      BLACKHOLE_WIDE_1440.mp4  ->  BLACKHOLE_WIDE_1080.mp4  BLACKHOLE_WIDE_720.mp4
rem      BLACKHOLE_TALL_1440.mp4  ->  BLACKHOLE_TALL_1080.mp4  BLACKHOLE_TALL_720.mp4
rem      UNIVERSE_1080.webm       ->  UNIVERSE_1080.mp4        UNIVERSE_720.mp4
rem
rem  To get another name, rename the file first. If those files are already
rem  in the videos folder, it asks before replacing them.
rem
rem  One keyframe per file, so the loop never "breathes". Portrait videos stay
rem  portrait (1080 x 1920 and 720 x 1280).
rem
rem  Needs ffmpeg once:   winget install Gyan.FFmpeg
rem  Usage:              compress_videos.cmd FILE [FILE ...]
rem                      or drop the files on this script in Explorer
rem  Example:            compress_videos.cmd BLACKHOLE_WIDE_1440.mp4 BLACKHOLE_TALL_1440.mp4
rem                      compress_videos.cmd C:\Users\Teoman\Desktop\BLACKHOLE_*_1440.mp4
rem
rem  Smaller files: raise CRF_1080 and CRF_720 below (each +2 is about 25%
rem  smaller), or set FPS=30 to keep half of the frames.
rem ============================================================================
setlocal

set "CRF_1080=24"
set "CRF_720=25"
set "FPS="

rem OPENED BY DROPPING FILES ON IT: KEEP THE WINDOW OPEN AT THE END TO READ IT
rem (DELAYED EXPANSION, SO QUOTES OR "&" IN THE PATHS CANNOT BREAK THE TEST)
setlocal EnableDelayedExpansion
set "LINE=!cmdcmdline!"
if defined LINE set "LINE=!LINE:"=!"
set "HOLD="
if defined LINE if /i not "!LINE:/c =!"=="!LINE!" set "HOLD=1"
endlocal & set "HOLD=%HOLD%"

if "%~1"=="" goto usage

ffmpeg -version >nul 2>nul
if errorlevel 1 goto noffmpeg

rem THE videos FOLDER NEXT TO tools, AS A CLEAN FULL PATH
for %%D in ("%~dp0..\videos") do set "OUT=%%~fD"
set "X264=-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -x264-params keyint=99999:min-keyint=99999:scenecut=0 -movflags +faststart -an"
set "RATE="
if defined FPS set "RATE=,fps=%FPS%"
set "COUNT=0"
set "PROBLEMS=0"

:next
if "%~1"=="" goto done
rem A PATTERN LIKE BLACKHOLE_*_1440.mp4 BECOMES EVERY FILE IT MATCHES
set "SEEN="
for %%F in ("%~1") do call :one "%%~fF"
if not defined SEEN call :nothing "%~1"
shift
goto next

rem ----------------------------------------------------------------------------
rem  ONE FILE
rem ----------------------------------------------------------------------------
:one
set "SEEN=1"
set "SRC=%~f1"
set "NAME=%~n1"
echo.

if exist "%SRC%" goto found
echo "%SRC%" was not found.
set /a "PROBLEMS+=1"
goto :eof

:found
rem "BLACKHOLE_WIDE_1440 (1)" (A SECOND DOWNLOAD) -> "BLACKHOLE_WIDE_1440"
if "%NAME:~-4,2%"==" (" if "%NAME:~-1%"==")" set "NAME=%NAME:~0,-4%"
rem "BLACKHOLE_WIDE_1440" -> "BLACKHOLE_WIDE"
if /i "%NAME:~-5%"=="_2160" set "NAME=%NAME:~0,-5%"
if /i "%NAME:~-5%"=="_1440" set "NAME=%NAME:~0,-5%"
if /i "%NAME:~-5%"=="_1080" set "NAME=%NAME:~0,-5%"
if /i "%NAME:~-4%"=="_720" set "NAME=%NAME:~0,-4%"

set "BIG=%OUT%\%NAME%_1080.mp4"
set "SMALL=%OUT%\%NAME%_720.mp4"
echo %~nx1  -^>  %NAME%_1080.mp4  %NAME%_720.mp4

set "OLD="
if exist "%BIG%" set "OLD=1"
if exist "%SMALL%" set "OLD=1"
if not defined OLD goto make
choice /c YN /n /m "   %NAME% is already in the videos folder. Replace it? [Y/N] "
if errorlevel 2 goto keep

:make
echo    Making %NAME%_1080.mp4 ...
ffmpeg -v error -stats -y -i "%SRC%" -vf "scale='if(gt(iw,ih),1920,1080)':'if(gt(iw,ih),1080,1920)':flags=lanczos%RATE%" %X264% -crf %CRF_1080% "%OUT%\%NAME%_1080.new.mp4"
if errorlevel 1 goto broke

echo    Making %NAME%_720.mp4 ...
ffmpeg -v error -stats -y -i "%SRC%" -vf "scale='if(gt(iw,ih),1280,720)':'if(gt(iw,ih),720,1280)':flags=lanczos%RATE%" %X264% -crf %CRF_720% "%OUT%\%NAME%_720.new.mp4"
if errorlevel 1 goto broke

move /y "%OUT%\%NAME%_1080.new.mp4" "%BIG%" >nul
move /y "%OUT%\%NAME%_720.new.mp4" "%SMALL%" >nul
call :size "%BIG%"
call :size "%SMALL%"
set /a "COUNT+=1"
goto :eof

:keep
echo    Kept the old files, nothing was changed.
goto :eof

:broke
echo    ffmpeg stopped with an error. Nothing was replaced.
del /q "%OUT%\%NAME%_1080.new.mp4" "%OUT%\%NAME%_720.new.mp4" 2>nul
set /a "PROBLEMS+=1"
goto :eof

:nothing
echo.
echo Nothing matches "%~1".
set /a "PROBLEMS+=1"
goto :eof

rem "BLACKHOLE_WIDE_1080.mp4  10.1 MB"
:size
set /a "TENTHS=%~z1 / 104858"
set /a "WHOLE=TENTHS / 10, PART=TENTHS %% 10"
echo    %~nx1  %WHOLE%.%PART% MB
goto :eof

rem ----------------------------------------------------------------------------
rem  THE END
rem ----------------------------------------------------------------------------
:done
echo.
if "%PROBLEMS%"=="0" echo Done: %COUNT% made, in "%OUT%".
if not "%PROBLEMS%"=="0" echo Done: %COUNT% made, %PROBLEMS% had a problem. See above.
goto end

:usage
echo Usage: compress_videos.cmd FILE [FILE ...]
echo        or drop the rendered files on this script.
echo Example: compress_videos.cmd BLACKHOLE_WIDE_1440.mp4 BLACKHOLE_TALL_1440.mp4
echo The names come from the files: BLACKHOLE_WIDE_1440.mp4 makes BLACKHOLE_WIDE_1080.mp4 and BLACKHOLE_WIDE_720.mp4.
goto end

:noffmpeg
echo ffmpeg was not found. Install it once with:  winget install Gyan.FFmpeg
echo then open a new terminal and run this again.
goto end

:end
if defined HOLD pause
endlocal
