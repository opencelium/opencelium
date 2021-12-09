import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {toggleNotificationPanel} from "@actions/auth";
import styles from "@themes/default/layout/header.scss";
import Callout from "@components/layout/header/Callout";
import {CNotification} from "@classes/components/general/CNotification";
import {withTranslation} from "react-i18next";
import Search from "@components/layout/header/Search";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        notifications: auth.get('notifications').toJS(),
        isAuth: auth.get('isAuth'),
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
                }, () => setTimeout(() => this.setState({isCalloutVisible: false, notificationsAmount}), 3000));
            }
        } else{
            if(this.state.notificationsAmount !== notificationsAmount && !this.state.isCalloutVisible){
                this.setState({
                    notificationsAmount,
                })
            }
        }
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
        const calloutMessage = notifications.length > 0 ? CNotification.getMessage(t, notifications[0]).message : '';
        const calloutType = notifications.length > 0 ? notifications[0].type : '';
        if(!this.props.isAuth){
            if(isCalloutVisible && calloutMessage){
                return (
                    <div className={styles.single_callout}>
                        <Callout message={calloutMessage} type={calloutType} isBottom={false}/>
                    </div>
                );
            } else{
                return null;
            }
        }
        return(
            <div className={styles.top_bar} id={'app_header'}>
                <Search/>
                {/*<Input className={styles.search_input} placeholder={'Search'}/>*/}
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