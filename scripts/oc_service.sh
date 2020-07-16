#!/bin/bash
#
#  Copyright (C) <2019>  <becon GmbH>
#  
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, version 3 of the License.
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
#  GNU General Public License for more details.
#  
#  You should have received a copy of the GNU General Public License
#  along with this program. If not, see <http://www.gnu.org/licenses/>.

refresh_db()
{
	if [ "$1" != "" ]
	then
		/usr/bin/mysql -u $1 -p < /opt/src/backend/database/oc_data.sql;
		rm -rf /var/lib/neo4j/data/*
		/etc/init.d/neo4j restart
	else
	    echo "please enter username as a second";
	fi
}

rebuild_backend(){
	cd /opt/src/backend/ && gradle build > /opt/logs/oc_backend.out &
}

stop_backend()
{
	/usr/lib/klibc/bin/kill $(pgrep -f "java -Dserver")
}

start_backend(){
	RETRY=20

	while [ $RETRY -gt 0 ]
	do
	    	if lsof -Pi :9090 -sTCP:LISTEN -t >/dev/null ;
	    	then
	        	echo "Port 9090 is used. Retrying Again" >&2
		        RETRY=$((RETRY-1))
		        sleep 2
	    	else
	        	cd /opt/src/backend/ && nohup java -Dserver.port=9090 -jar /opt/src/backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar > /opt/logs/oc_backend.out &
	        	echo "backend started..."
	        	return 1
		fi
	done

	echo "Server couldnt be started. Port 9090 is used."
}

restart_backend(){
	stop_backend
	start_backend
}

stop_frontend()
{
        /usr/lib/klibc/bin/kill $(pgrep -f "/usr/bin/node dev_server.js --mode development")
}

start_frontend(){
        RETRY=20

        while [ $RETRY -gt 0 ]
        do	
		if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ;
        	then
        		echo "Port 8888 is used. Retrying Again" >&2
		        RETRY=$((RETRY-1))
                	sleep 2
		else
        		cd /opt/src/frontend/ && nohup yarn --cwd /opt/src/frontend --cache-folder /opt/src/frontend start_dev > /opt/logs/oc_frontend.out &
		        echo "frontend started..."
                	return 1
		fi
	done

        echo "Server couldnt be started. Port 8888 is used."	
}

restart_frontend(){
        stop_frontend
        start_frontend
}

check_frontend(){
                
	if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ;
        then echo ""
        else
        	cd /opt/src/frontend/ && nohup yarn --cwd /opt/src/frontend --cache-folder /opt/src/frontend start_dev > /opt/logs/oc_frontend.out &
                echo "frontend started..."
                return 1
        fi

        echo "Frontend already started."    
}

check_backend(){

        if lsof -Pi :9090 -sTCP:LISTEN -t >/dev/null ;
        then echo ""
        else
        	cd /opt/src/backend/ && nohup java -Dserver.port=9090 -jar /opt/src/backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar > /opt/logs/oc_backend.out &
                echo "backend started..."
                return 1
        fi

        echo "Backtend already started."
}

###### MAIN
if [ "$1" != "" ]
then
	$1 $2
else
    echo "please use one of the following commands: refresh_db rebuild_backend stop_backend start_backend restart_backend stop_frontend start_frontend restart_frontend check_frontend check_backend"
fi
