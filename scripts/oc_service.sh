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
	   echo "Usage: oc backup -d /var/backups/opencelium -u username -p password -r"
	   echo ""
	   echo -e "\t-d Set path to the backup directory"
	   echo -e "\t-u Database username"
	   echo -e "\t-p Database password"
	   echo -e "\t-n [optional] Filename (default OC_TIMESTAMP)"
	   echo -e "\t-r [optional] Removing backups older than 14 days"
	   exit 1 # Exit script after printing help
}

backup(){

	OPTIND=2
	R_FLAG=false

	while getopts "d:u:p:n:r" opt
	do
	   case "$opt" in
	      d ) backupdir="$OPTARG" ;;
	      u ) username="$OPTARG" ;;
	      p ) password="$OPTARG" ;;
	      n ) name="$OPTARG" ;;
	      r ) R_FLAG=true ;;
	      ? ) helpBackup ;; # Print helpInfo in case parameter is non-existent
	   esac
	done

	# Init name
	if [ -z "$name" ]; then
           current_time=$(date "+%Y%m%d%H%M%S")
	   name="OC_$current_time"
	fi
	echo "Backup filename is $name"

	# Print helpInfo in case parameters are empty
        if [ -z "$backupdir" ] || [ -z "$username" ] || [ -z "$password" ]; then
           echo "Missing required arguments. Use -d for backupdir, -u for MySQL user, -p for MySQL password."
           helpBackup
        fi

	backupdir=$backupdir/$(date +%Y%m%d)

	# Deleting already exists backups
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
	cd $backupdir
	tar -zcf ${backupdir}.tar.gz .

	echo "removing temporary backup folder"	
	rm -r $backupdir 

	if [ "$R_FLAG" = true ]; then		
		echo "Cleanup backups older 14 days"
		find $(dirname ${backupdir}) -name "*.tar.gz" -mtime +14 -delete
	fi
}

helpRestore()
{
           echo ""
           echo "Usage: oc restore -d /var/backups/ -u username -p password -n 20250520"
           echo ""
           echo -e "\t-d Set path to the backup directory"
           echo -e "\t-u Database username"
           echo -e "\t-p Database password"
           echo -e "\t-n Backup name"
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

	# Set default backup name if not provided
	if [ -z "$name" ]; then
	   echo "No backup name provided. Please use -n to specify backup (e.g., OC_20240519.tar.gz)"
           helpRestore
	fi

	# Check required arguments
	if [ -z "$backupdir" ] || [ -z "$username" ] || [ -z "$password" ]; then
	   echo "Missing required arguments. Use -d for backupdir, -u for MySQL user, -p for password."
           helpRestore
	fi

	# Compose full path
	backupfile="${backupdir}/${name}.tar.gz"

	if [ ! -f "$backupfile" ]; then
	    echo "Backup file not found: $backupfile"
	    exit 1
	fi
	
	mkdir -p $backupdir/$(basename "$name")

	echo "Extracting backup archive..."
	tar -zxf "$backupfile" -C "$backupdir/$(basename "$name")"

	# Extracted folder path
	restore_dir="${backupdir}/$(basename "$name")"

	if [ ! -d "$restore_dir" ]; then
	    echo "Extracted backup folder not found: $restore_dir"
	    exit 1
	fi

	echo "Restoring MongoDB..."
	mongorestore --drop "$restore_dir"/opencelium

	echo "Restoring MySQL..."
	mysql -u "$username" -p"$password" opencelium < "$restore_dir/oc_data.sql"

	echo "Restoring Installation Directory..."
	cp -r "$restore_dir/opt-backup/"* /opt/opencelium/

	echo "Restore complete."

	# Clean up extracted data
	rm -rf "$restore_dir"

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
    echo "backup			- create a backup file"
    echo "restore			- restore from a backup file"
fi
