:: This will start the Python local server
:: Python must be addedd to the PATH variable in Windowss
start "" /min python -m http.server 8000 --bind 127.0.0.1 

:: Give the HTTP server a second to start (optional).
sleep 5

:: Open Chrome at the instantiated local server
start "" Chrome http://127.0.01:8000/project.html

:: Close batch script, Python will take over from here