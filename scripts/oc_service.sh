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

systemd(){
    JAVA_BIN=$(which java)
    $JAVA_BIN -Dserver.port=$(get_backend_port) -jar /opt/opencelium/src/backend/build/libs/opencelium.backend-$(get_version).jar --spring.config.location=/opt/opencelium/src/backend/src/main/resources/application.yml
}

get_version()
{
	echo $(grep 'version:' /opt/opencelium/src/backend/src/main/resources/application_default.yml | awk '{print $2}')
}

get_backend_port()
{
        echo $(grep -A1 'server:' /opt/opencelium/src/backend/src/main/resources/application_default.yml | awk '{print $2}')
}

get_http_protocol()
{
	ssl=$(grep 'ssl:' /opt/opencelium/src/backend/src/main/resources/application_default.yml | awk '{print $1}')

	if [ "$ssl" == "" ]
	then
		echo "http"
	else
	   	    ssl=$(grep 'ssl:' /opt/opencelium/src/backend/src/main/resources/application_default.yml | awk '{print $1}')
                    if [ "$ssl" = "ssl:" ]
        		then
	                	echo "https"
        		else
				echo "http"
        		fi
        fi
}

get_url()
{
	url=$(get_http_protocol)"://"$(hostname -f)":"$(get_backend_port)
	echo $url

}

helpBackup()
{
	   echo ""
	   echo "Usage: oc backup -d /var/backups/opencelium -u username -p password"
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

	backupdir=$backupdir/$(date +%Y%m%d)

	# Clear old Backups
	if [ -d "$backupdir" ];then
		echo "Backup Directory $backupdir alreay exists. Deleting...."
		rm -rf $backupdir
	fi

	mkdir -p $backupdir


	echo "Backup Databases"
	/usr/bin/mongodump --db opencelium --out=$backupdir
	/usr/bin/mysqldump -u $username -p$password opencelium > $backupdir/oc_data.sql

	echo "Backup Installation Directory"
	cp -r /opt/opencelium/ $backupdir/opt-backup/

	echo "Compress Backups"
	tar -zcf ${backupdir}.tar.gz $backupdir

	echo "removing temporary backup folder"	
	rm -r $backupdir

	echo "Cleanup backups older 14 days"
	find $(dirname ${backupdir}) -name "*.tar.gz" -mtime +14 -delete
}

###### MAIN
if [ "$1" != "" ]
then
	$1 $@
else
    echo ""
    echo "Please use one of the following commands:"
    echo ""
    echo "get_version		- show opencelium version"
    echo "get_backend_port	- show configured backend port"
    echo "backup			- creates a backup of the entire system"
fi
