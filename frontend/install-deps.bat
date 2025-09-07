@echo off
echo Installing frontend dependencies one by one...
echo This helps avoid network timeout issues.

echo.
echo Installing React core...
npm install react@18.2.0 react-dom@18.2.0 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install React core
    pause
    exit /b 1
)

echo.
echo Installing Vite build tools...
npm install vite@5.0.8 @vitejs/plugin-react@4.2.1 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install Vite
    pause
    exit /b 1
)

echo.
echo Installing Tailwind CSS...
npm install tailwindcss@3.3.6 autoprefixer@10.4.16 postcss@8.4.32 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install Tailwind CSS
    pause
    exit /b 1
)

echo.
echo Installing Socket.IO client...
npm install socket.io-client@4.7.4 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install Socket.IO client
    pause
    exit /b 1
)

echo.
echo Installing Firebase...
npm install firebase@10.7.1 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install Firebase
    pause
    exit /b 1
)

echo.
echo Installing UI components...
npm install lucide-react@0.303.0 react-hot-toast@2.4.1 --timeout=300000
if %errorlevel% neq 0 (
    echo Failed to install UI components
    pause
    exit /b 1
)

echo.
echo All dependencies installed successfully!
echo You can now run: npm run dev
pause
