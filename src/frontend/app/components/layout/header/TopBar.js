import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {toggleNotificationPanel} from "@actions/auth";
import styles from "@themes/default/layout/header.scss";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        notifications: auth.get('notifications').toJS(),
    }
}

@connect(mapStateToProps, {toggleNotificationPanel})
class TopBar extends React.Component{
    constructor(props) {
        super(props);
    }

    onClickSearchIcon(){

    }

    onClickNotifications(){
        this.props.toggleNotificationPanel();
    }

    onClickMyProfile(){
        this.props.router.push('/myprofile');
    }

    render(){
        const {notifications} = this.props;
        const notificationAmount = notifications.length;
        return(
            <div className={styles.top_bar}>
                <Input className={styles.search_input} placeholder={'Search'}/>
                <TooltipFontIcon darkTheme tooltip={'Search'} value={'search'} tooltipPosition={'bottom'} iconClassName={styles.search_icon} isButton onClick={::this.onClickSearchIcon}/>
                <div className={styles.notifications}>
                    {notificationAmount !== 0 && <div className={styles.notification_number} onClick={::this.onClickNotifications}>{`+${notificationAmount}`}</div>}
                    <TooltipFontIcon disabled={notificationAmount === 0} darkTheme tooltip={'Notifications'} value={'notifications'} tooltipPosition={'bottom'} isButton onClick={::this.onClickNotifications}/>
                </div>
                <TooltipFontIcon darkTheme tooltip={'My Profile'} value={'face'} tooltipPosition={'bottom'} isButton onClick={::this.onClickMyProfile}/>
            </div>
        );
    }
}

export default withRouter(TopBar);