A work in progress for my Chromecast app.

=========================================

QUICKSTART GUIDE:
- Clone this repo wherever you want. I run my testing on Ubuntu 14.04; other operating systems are not guaranteed.
- Navigate in a terminal to the /codycast/server/
- Run web.py as a python script. If you want debugging, append -d to the command. I use version 2.7; other versions probably won't work.
- Find your local IP address and open a browser. The url is of the form http://[LOCAL_IP]:3000/[DIRECTORY]/[FILENAME]. Only specific filetypes are supported.
- THE CHROMECAST PAGE IS NOT FLESHED OUT. If there's a Chromecast on your network, the app will find it. However, the URL it gives the Chromecast is hardcoded in. In other words it doesn't give the Chromecast your local IP (unless it's 192.168.1.7) and it only tries to play the /media/small.mp4 file. The hardcoded URL is line 160-ish in /js/app.js.

=========================================

DETAILED NOTES:

In order to load one of the APIs (the Chromecast one?), the main app (index.html) has to be served from a legitimate server - not from localhost. It's just fine if it's served from your local machine, but it can't be localhost or the API won't load.

Any server is sufficient to load the page itself, but this repo includes a server from one of my CS classes, retrofitted specifically for this project. There are still some files included that aren't necessary that I will remove soon. The main server logic is in the processClientCommand function in the "poller.py" file. The config file sets the default directory to be two folders above where your current directory is (../..). I haven't tested running the server from any directory other than "server", so that's what I recommend.
