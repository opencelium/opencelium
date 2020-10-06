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