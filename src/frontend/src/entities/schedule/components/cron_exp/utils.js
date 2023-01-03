/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

/**
 * to convert time for cron expression
 *
 * @param timeStamp - time
 */
export function convertTimeForCronExpression(timeStamp){
    let date = new Date(timeStamp);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let dateValue = date.getDate();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let day = date.getDay();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    seconds = seconds < 10 ? '0'+seconds : seconds;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    hours = hours < 10 ? '0'+hours : hours;
    dateValue = dateValue < 10 ? '0'+dateValue : dateValue;
    month = month < 10 ? '0'+month : month;
    return <li key={`cron_example_${date.valueOf()}`}><span style={{width: '60px', display: 'inline-block', textAlign: 'right'}}>{`${hours}:${minutes}:${seconds}`}</span><span style={{width: '45px', display: 'inline-block'}}>{days[day]}</span><span style={{width: '55px', display: 'inline-block'}}>{`${dateValue}.${month}.${year}`}</span></li>;
}


export const ALL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
