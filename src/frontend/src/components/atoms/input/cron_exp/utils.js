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
    return <span><span style={{width: '60px', display: 'inline-block', textAlign: 'right'}}>{`${hours}:${minutes}:${seconds}`}</span><span style={{width: '45px', display: 'inline-block'}}>{days[day]}</span><span style={{width: '55px', display: 'inline-block'}}>{`${dateValue}.${month}.${year}`}</span></span>;
}


export const ALL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
