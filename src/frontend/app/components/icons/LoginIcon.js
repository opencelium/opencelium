/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React from 'react';
import styles from '../../themes/default/general/icons.scss';

const LoginIcon = ({isUnlocked, ...props}) => {
    return(
        <button {...props} className={styles.wrapper}>
            <div className={styles.base}>
                <div className={styles.base_bottom}>
                </div>
                <div className={styles.lock_inside_top}>
                </div>
                <div className={styles.lock_inside_bottom}>
                </div>
            </div>
            <div className={`${styles.lock_cirlce} ${isUnlocked ? styles.unlock_circle : ''}`}>
                <div className={styles.lock_circle_inside}>
                </div>
            </div>
            <div className={`${styles.lock_box} ${isUnlocked ? styles.unlock_box : ''}`}>
            </div>
        </button>
    )
};

export default LoginIcon;