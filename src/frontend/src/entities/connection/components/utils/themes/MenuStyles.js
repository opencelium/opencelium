/*
 *  Copyright (C) <2022>  <becon GmbH>
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

export const MenuStyle = (theme) => {
    let styles = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '95px',
        height: '100vh',
        backgroundColor: '#012E55',
        color: '#eee',
        padding: '1.5rem 1.5rem 2rem',
        transition: '.5s',
        zIndex: 1000,
    };
    if(theme === 'other'){
        styles.backgroundColor = '#01553d';
    }
    return styles;
};