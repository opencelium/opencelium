import React from 'react';
import {connect} from 'react-redux';
import styles from '@themes/default/layout/notification.scss';
import Notification from "@components/layout/notification/Notification";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

import {toggleNotificationPanel, clearAllNotifications} from "@actions/auth";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        isNotificationPanelOpened: auth.get('isNotificationPanelOpened'),
        notifications: auth.get('notifications').toJS(),
    }
}

@connect(mapStateToProps, {toggleNotificationPanel, clearAllNotifications})
class NotificationPanel extends React.Component{
    constructor(props) {
        super(props);

        this.notificationPanel = React.createRef();
    }

    componentDidMount() {
        document.addEventListener("mousedown", ::this.checkIfClickedOutside)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {notifications, isNotificationPanelOpened, toggleNotificationPanel} = this.props;
        if(notifications.length === 0 && isNotificationPanelOpened){
            toggleNotificationPanel();
        }
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", ::this.checkIfClickedOutside)
    }

    checkIfClickedOutside(e){
        if (this.props.isNotificationPanelOpened && this.notificationPanel.current && !this.notificationPanel.current.contains(e.target)) {
            this.props.toggleNotificationPanel()
        }
    }

    clearAllNotifications(){
        const {clearAllNotifications, toggleNotificationPanel} = this.props;
        clearAllNotifications();
        toggleNotificationPanel();
    }

    render(){
        const {notifications, isNotificationPanelOpened, toggleNotificationPanel} = this.props;
        let className = styles.notification_panel;
        if(isNotificationPanelOpened){
            className += ` ${styles.opened}`;
        }
        return(
            <div className={className} ref={this.notificationPanel}>
                <TooltipFontIcon size={20} className={styles.close_icon} isButton={true} tooltipPosition={'left_bottom'} value={'close'} tooltip={'Close'} onClick={toggleNotificationPanel}/>
                <div className={styles.panel_title}>Notifications</div>
                <div className={styles.actions}>
                    {/*<div className={styles.more_notifications_icon}>More notifications</div>*/}
                    <div className={styles.delete_all_icon} onClick={::this.clearAllNotifications}>Clear all</div>
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