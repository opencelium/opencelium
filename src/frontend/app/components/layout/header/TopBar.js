import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {toggleNotificationPanel} from "@actions/app";
import styles from "@themes/default/layout/header.scss";


@connect(null, {toggleNotificationPanel})
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
        const notificationNumber = 6;
        return(
            <div className={styles.top_bar}>
                <Input className={styles.search_input} placeholder={'Search'}/>
                <TooltipFontIcon darkTheme tooltip={'Search'} value={'search'} tooltipPosition={'bottom'} iconClassName={styles.search_icon} isButton onClick={::this.onClickSearchIcon}/>
                <div className={styles.notifications}>
                    {notificationNumber && <div className={styles.notification_number} onClick={::this.onClickNotifications}>{`+${notificationNumber}`}</div>}
                    <TooltipFontIcon disabled={!notificationNumber} darkTheme tooltip={'Notifications'} value={'notifications'} tooltipPosition={'bottom'} isButton onClick={::this.onClickNotifications}/>
                </div>
                <TooltipFontIcon darkTheme tooltip={'My Profile'} value={'face'} tooltipPosition={'bottom'} isButton onClick={::this.onClickMyProfile}/>
            </div>
        );
    }
}

export default withRouter(TopBar);