import React from 'react';
import {connect} from 'react-redux';
import styles from '@themes/default/layout/notification.scss';
import Notification from "@components/layout/notification/Notification";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

import {toggleNotificationPanel} from "@actions/app";

function mapStateToProps(state){
    const app = state.get('app');
    return{
        isNotificationPanelOpened: app.get('isNotificationPanelOpened'),
        notifications: [
            {id: 1, type: 'info', title: 'OC Update', message: 'New Version is available. Click here to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant', createdTime: 'a few seconds ago', onClick: () => {}},
            {id: 2, type: 'warning', title: 'OC Update', message: 'Here to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant. ere to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant. ere to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant', createdTime: 'a few seconds ago', onClick: () => {}},
            {id: 3, type: 'error', title: 'Elasticsearch is down', message: 'Please, check configuration', createdTime: '10 minutes ago'},
            {id: 4, type: 'warning', title: 'OC Update', message: 'New Version is available. Click here to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant', createdTime: 'a few seconds ago', onClick: () => {}},
            {id: 5, type: 'info', title: 'OC Update', message: 'Here to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant. ere to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant. ere to start update assistantNew Version is available. Click here to start update assistantNew Version is available. Click here to start update assistant', createdTime: 'a few seconds ago', onClick: () => {}},
            {id: 6, type: 'error', title: 'Elasticsearch is down', message: 'Please, check configuration', createdTime: '10 minutes ago'},
        ],
    }
}

@connect(mapStateToProps, {toggleNotificationPanel})
class NotificationPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {notifications, isNotificationPanelOpened, toggleNotificationPanel} = this.props;
        let className = styles.notification_panel;
        if(isNotificationPanelOpened){
            className += ` ${styles.opened}`;
        }
        return(
            <div className={className}>
                <TooltipFontIcon size={20} className={styles.close_icon} isButton={true} tooltipPosition={'left_bottom'} value={'close'} tooltip={'Close'} onClick={toggleNotificationPanel}/>
                <div className={styles.panel_title}>Notifications</div>
                <div className={styles.actions}>
                    <div className={styles.more_notifications_icon}>More notifications</div>
                    <div className={styles.delete_all_icon}>Clear all</div>
                </div>
                <div className={styles.notifications}>
                    {
                        notifications.map(notification =>(
                            <Notification key={notification.id} notification={notification}/>
                        ))
                    }
                </div>
            </div>
        );
    }
}

export default NotificationPanel;