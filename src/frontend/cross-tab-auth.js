
/*
 * Copyright (C) <2019>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var sessionStorageTransfer = function(event) {
    if(!event) { event = window.event; }
    if(!event.newValue) return;
    if (event.key == 'getSessionStorage') {
        localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
        localStorage.removeItem('sessionStorage');
    } else if (event.key == 'sessionStorage' && !sessionStorage.length) {
        var data = JSON.parse(event.newValue);
        for (var key in data) {
            sessionStorage.setItem(key, data[key]);
        }
    }
};

if(window.addEventListener) {
    window.addEventListener("storage", sessionStorageTransfer, false);
} else {
    window.attachEvent("onstorage", sessionStorageTransfer);
};
if (!sessionStorage.length) {
    localStorage.setItem('getSessionStorage', '1');
    localStorage.removeItem('getSessionStorage', '1');
};