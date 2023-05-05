#!/bin/bash
#
#  Copyright (C) <2023>  <becon GmbH>
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

get_version()
{
        echo $(grep 'version =' /opt/src/backend/build.gradle | awk '{print $3}') | sed s/\'//g
}

get_backend_port()
{
        echo $(grep -A1 'server:' /opt/src/backend/src/main/resources/application.yml | awk '{print $2}')
}

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
	kill $(pgrep -f "java -Dserver")
}

start_backend(){
	RETRY=20

	while [ $RETRY -gt 0 ]
	do
	    	if lsof -Pi :$(get_backend_port) -sTCP:LISTEN -t >/dev/null ;
	    	then
	        	echo "Port $(get_backend_port) is used. Retrying Again" >&2
		        RETRY=$((RETRY-1))
		        sleep 2
	    	else
	        	cd /opt/src/backend/ && nohup java -Dserver.port=$(get_backend_port) -jar /opt/src/backend/build/libs/opencelium.backend-$(get_version).jar --spring.config.location=/opt/src/backend/src/main/resources/application.yml > /opt/logs/oc_backend.out &
	        	echo "backend started..."
	        	return 1
		fi
	done

	echo "Server couldnt be started. Port $(get_backend_port) is used."
}

restart_backend(){
	stop_backend
        sleep 1
	start_backend
}

rebuild_frontend(){
        cd /opt/src/frontend/ && nohup /usr/bin/node server.js > /opt/logs/oc_frontend.out &
}

stop_frontend()
{
	kill $(pgrep -f "bin/node server.js")
	sleep 1
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
        		cd /opt/src/frontend/ && nohup /usr/bin/node server.js > /opt/logs/oc_frontend.out &
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
        	cd /opt/src/frontend/ && nohup /usr/bin/node server.js > /opt/logs/oc_frontend.out &
                echo "frontend started..."
                return 1
        fi

        echo "Frontend already started."
}

check_backend(){

        if lsof -Pi :$(get_backend_port) -sTCP:LISTEN -t >/dev/null ;
        then echo ""
        else
        	cd /opt/src/backend/ && nohup java -Dserver.port=$(get_backend_port) -jar /opt/src/backend/build/libs/opencelium.backend-$(get_version).jar --spring.config.location=/opt/src/backend/src/main/resources/application.yml > /opt/logs/oc_backend.out &
                echo "backend started..."
                return 1
        fi

        echo "Backtend already started."
}

helpBackup()
{
	   echo ""
	   echo "Usage: oc backup -d /backup/dir -u username -p password"
	   echo ""
	   echo -e "\t-d Set path to the backup directory"
	   echo -e "\t-u Database username"
	   echo -e "\t-p Database password"
	   echo -e "\t-n [optional] Filename (default OC_TIMESTAMP)"
	   exit 1 # Exit script after printing help
}

backup(){

	OPTIND=2
	while getopts "d:u:p:n:" opt
	do
	   case "$opt" in
	      d ) backupdir="$OPTARG" ;;
	      u ) username="$OPTARG" ;;
	      p ) password="$OPTARG" ;;
	      n ) name="$OPTARG" ;;
	      ? ) helpBackup ;; # Print helpInfo in case parameter is non-existent
	   esac
	done

	# Init name
	if [ -z "$name" ]
	then
           current_time=$(date "+%Y%m%d%H%M%S")
	   name="OC_$current_time"
	fi

	        # Print helpInfo in case parameters are empty
        if [ -z "$backupdir" ] || [ -z "$username" ] || [ -z "$password" ]
        then
           echo "Some or all of the parameters are empty";
           helpBackup
        fi

	### clear old backups
	rm -rf $backupdir/graph.db.dump
	rm -rf $backupdir/oc_data.sql
	rm -rf $backupdir/sourcecode.zip
	rm -rf $backupdir/$name.zip

	/usr/bin/systemctl stop neo4j

	### database backup
	/usr/bin/neo4j-admin dump --database=graph.db --to=$backupdir
	/usr/bin/mysqldump -u $username -p$password opencelium > $backupdir/oc_data.sql

	/usr/bin/systemctl start neo4j

	### file system backup
	zip -q -r $backupdir/sourcecode.zip /opt/ 2>/dev/null

	### save all together in one backup file
	zip -q -r $backupdir/$name.zip $backupdir/sourcecode.zip $backupdir/oc_data.sql $backupdir/graph.db.dump 2>/dev/null

        ### clear old backups
        rm -rf $backupdir/graph.db.dump
        rm -rf $backupdir/oc_data.sql
        rm -rf $backupdir/sourcecode.zip
}

helpRestore()
{
	   echo ""
	   echo "Usage: oc backup -d /backup/dir -u username -p password"
	   echo ""
	   echo -e "\t-d Set path from the backup directory"
	   echo -e "\t-u Database username"
	   echo -e "\t-p Database password"
	   echo -e "\t-n Filename of the backup file"
	   exit 1 # Exit script after printing help
}

restore(){

	OPTIND=2
	while getopts "d:u:p:n:" opt
	do
	   case "$opt" in
	      d ) backupdir="$OPTARG" ;;
	      u ) username="$OPTARG" ;;
	      p ) password="$OPTARG" ;;
	      n ) name="$OPTARG" ;;
	      ? ) helpRestore ;; # Print helpInfo in case parameter is non-existent
	   esac
	done

	        # Print helpInfo in case parameters are empty
        if [ -z "$backupdir" ] || [ -z "$username" ] || [ -z "$password" ] || [ -z "$name" ]
        then
           echo "Some or all of the parameters are empty";
           helpRestore
        fi

	### unzip backup file
	unzip -qq -o $backupdir/$name.zip -d /

	### stopping all services
	/usr/bin/systemctl stop neo4j
	/usr/bin/oc stop_backend
	/usr/bin/oc stop_frontend

	### database backup
	/usr/bin/neo4j-admin load --database=graph.db --from=$backupdir/graph.db.dump --force
	/usr/bin/mysql -u $username -p$password opencelium < $backupdir/oc_data.sql

	### change owner rights
	chown -R neo4j:neo4j /var/lib/neo4j/data/databases/graph.db/

	### file system backup
	unzip -qq -o $backupdir/$name.zip -d /

	rm $backupdir/sourcecode.zip $backupdir/oc_data.sql $backupdir/graph.db.dump

        ### starting all services
        /usr/bin/systemctl start neo4j
        /usr/bin/oc start_backend
        /usr/bin/oc rebuild_frontend
        sleep 60
	/usr/bin/oc start_frontend

	echo "[Hint] If the frontend doesnt start, please execute the commands rebuild_frontend and start_frontend."
}

###### MAIN
if [ "$1" != "" ]
then
	$1 $@
else
    echo ""
    echo "Please use one of the following commands:"
    echo ""
    echo "get_version           - show opencelium version"
    echo "get_backend_port      - show configured backend port"
    echo "refresh_db		- deletes all databases"
    echo "rebuild_backend		- rebuild backend files"
    echo "stop_backend		- stop backend service"
    echo "start_backend		- start backend service"
    echo "restart_backend		- restart backend service"
    echo "rebuild_frontend	- rebuild frontend files"
    echo "stop_frontend		- stop frontend service"
    echo "start_frontend		- start frontend service"
    echo "restart_frontend	- restart frontend service"
    echo "check_frontend		- checks if frontend is running. Otherwise the frontend will be started automatically"
    echo "check_backend		- checks if backend is running. Otherwise the backend will be started automatically"
    echo "backup			- creates a backup of the entire system"
    echo "restore			- restores the system"
fi
