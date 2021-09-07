import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {toggleNotificationPanel} from "@actions/auth";
import styles from "@themes/default/layout/header.scss";
import Callout from "@components/layout/header/Callout";
import {CNotification} from "@classes/components/general/CNotification";
import {withTranslation} from "react-i18next";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        notifications: auth.get('notifications').toJS(),
    }
}

@connect(mapStateToProps, {toggleNotificationPanel})
@withTranslation('notifications')
class TopBar extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isCalloutVisible: false,
            notificationsAmount: props.notifications.length,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let notificationsAmount = this.props.notifications.length > 99 ? 99 : this.props.notifications.length;
        if(prevProps.notifications.length < this.props.notifications.length){
            if(!this.state.isCalloutVisible){
                this.setState({
                    isCalloutVisible: true,
                }, () => setTimeout(() => this.setState({isCalloutVisible: false, notificationsAmount}), 3000))
            }
        } else{
            if(this.state.notificationsAmount !== notificationsAmount && !this.state.isCalloutVisible){
                this.setState({
                    notificationsAmount,
                })
            }
        }
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
        const {isCalloutVisible, notificationsAmount} = this.state;
        const {t, notifications} = this.props;
        const calloutMessage = notifications.length > 0 ? CNotification.getMessage(t, notifications[notifications.length - 1]).message : '';
        const calloutType = notifications.length > 0 ? notifications[notifications.length - 1].type : '';
        return(
            <div className={styles.top_bar}>
                <Input className={styles.search_input} placeholder={'Search'}/>
                {/*<TooltipFontIcon darkTheme tooltip={'Search'} value={'search'} tooltipPosition={'bottom'} iconClassName={styles.search_icon} isButton onClick={::this.onClickSearchIcon}/>*/}
                <div className={styles.notifications}>
                    {isCalloutVisible && calloutMessage && <Callout message={calloutMessage} type={calloutType}/>}
                    {notificationsAmount !== 0 && <div className={styles.notification_number} onClick={::this.onClickNotifications}>{`${notificationsAmount > 99 ? '+' : ''}${notificationsAmount}`}</div>}
                    <TooltipFontIcon disabled={notificationsAmount === 0} darkTheme tooltip={'Notifications'} value={'notifications'} tooltipPosition={'bottom'} isButton onClick={::this.onClickNotifications}/>
                </div>
                <TooltipFontIcon darkTheme tooltip={'My Profile'} value={'face'} tooltipPosition={'bottom'} isButton onClick={::this.onClickMyProfile}/>
            </div>
        );
    }
}

export default withRouter(TopBar);