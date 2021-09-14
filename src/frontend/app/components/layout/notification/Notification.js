import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TimeAgo from 'timeago-react';
import styles from '@themes/default/layout/notification.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {clearNotification} from "@actions/auth";
import {withTranslation} from "react-i18next";
import {NotificationMessageHandlers, NotificationType} from "@utils/constants/notifications/notifications";
import i18n from "@utils/i18n";
import {isString, parseConnectionPointer} from "@utils/app";
import Dialog from "@basic_components/Dialog";
import {CNotification} from "@classes/components/general/CNotification";


const MAX_NOTIFICATION_MESSAGE_LENGTH = 250;

const Details = ({t, shortMessage, comingMessage, onClick}) => {
    return(
        <span>{`${shortMessage}... (`}<a id='notification_url' href='#' onClick={(e) => onClick(e, comingMessage)}>{t('DETAILS')}</a>)</span>
    );
}

@connect(null, {clearNotification})
@withTranslation('notifications')
class Notification extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            showDialogInDetails: false,
            inDetailsMessage: '',
            isExtended: false,
            isMouseOver: false,
        }
    }

    toggleShowDialogInDetails(){
        this.setState({showDialogInDetails: !this.state.showDialogInDetails});
    }

    openDialog(e, inDetailsMessage){
        this.setState({showDialogInDetails: true, inDetailsMessage});
    }

    hasExtension(){
        const {t, notification} = this.props;
        const messageData = CNotification.getMessage(t, notification, ::this.renderServerMessage);
        return messageData.length > 65;
    }

    toggleExtension(){
        if(this.hasExtension()){
            this.setState({isExtended: !this.state.isExtended});
        }
    }

    onMouseOver(){
        this.setState({
            isMouseOver: true,
        })
    }

    onMouseLeave(){
        this.setState({
            isMouseOver: false,
        })
    }

    clearNotification(){
        this.props.clearNotification(this.props.notification);
    }

    renderDialogInDetails(){
        const {showDialogInDetails} = this.state;
        let {inDetailsMessage} = this.state;
        const {t} = this.props;
        const regColor = RegExp('#[0-9|a-f|A-F]{6}', 'g');
        const lastWord = inDetailsMessage.substr(inDetailsMessage.length - 7);
        const hasColor = regColor.test(lastWord);
        if(hasColor){
            inDetailsMessage = inDetailsMessage.substr(0, inDetailsMessage.length - 7);
        }
        return(
            <Dialog
                actions={[{label: t('DIALOG_DETAILS.CLOSE'), onClick: ::this.toggleShowDialogInDetails, id: 'dialog_close'}]}
                active={showDialogInDetails}
                toggle={::this.toggleShowDialogInDetails}
                title={t('DIALOG_DETAILS.TITLE')}
            >
                <p style={{overflow: 'auto'}}>
                    <span>{inDetailsMessage}</span>
                    {hasColor && <span style={{background: lastWord, width: '30px', height: '17px', verticalAlign: 'sub', display: 'inline-block', borderRadius: '2px', marginLeft: '5px'}}/>}
                </p>
            </Dialog>
        );
    }

    renderServerMessage(comingMessage){
        const {t, notification} = this.props;
        let {shortMessage} = notification;
        if(shortMessage === ''){
            shortMessage = comingMessage.substr(0, MAX_NOTIFICATION_MESSAGE_LENGTH);
        }
        let result = {message: comingMessage, length: comingMessage.length};
        let colorRegExp = /^(.*)#[0-9a-f]{6}(.*)/gi;
        let checkColorRegExp = colorRegExp.exec(comingMessage);
        if(comingMessage.length > MAX_NOTIFICATION_MESSAGE_LENGTH){
            const {setHasCloseButton} = this.props;
            if(setHasCloseButton) {
                setHasCloseButton(true);
            }
            return {message: <Details t={t} shortMessage={shortMessage} comingMessage={comingMessage} onClick={::this.openDialog}/>, length: shortMessage.length + t('DETAILS').length + 3};
        }
        if(checkColorRegExp && checkColorRegExp.length > 2){
            let color = comingMessage.substring(checkColorRegExp[1].length, checkColorRegExp[1].length + 7);
            let colorStyles = {height: '17px', width: '40px', display: 'inline-block', margin: '0 5px'};
            result.message = <span>{checkColorRegExp[1]}<span style={{...colorStyles, background: color}}/>{checkColorRegExp[2]}</span>;
            result.length = checkColorRegExp[1].length + checkColorRegExp[2].length;
        }
        return result;
    }

    render(){
        const {isExtended, isMouseOver} = this.state;
        const {t, notification} = this.props;
        let title = t(`SYSTEMS.${notification.title.toUpperCase()}`);
        let messageData = CNotification.getMessage(t, notification, ::this.renderServerMessage);
        if(isString(messageData.message) && messageData.length > MAX_NOTIFICATION_MESSAGE_LENGTH){
            messageData.message = <Details t={t} shortMessage={messageData.message.substr(0, MAX_NOTIFICATION_MESSAGE_LENGTH)} comingMessage={messageData.message} onClick={::this.openDialog}/>;
        }
        let timeAgo = <TimeAgo
            datetime={notification.createdTime}
            locale='de_DE'
        />;
        let messageStyles = {
            height: '50px',
            minHeight: '50px',
            maxHeight: '50px',
        }
        let unFoldIcon = {
            tooltip: 'Unfold More',
            value: 'unfold_more',
        }
        if(isExtended){
            messageStyles = {
                height: '150px',
                minHeight: '150px',
                maxHeight: '150px',
            };
            unFoldIcon = {
                tooltip: 'Unfold Less',
                value: 'unfold_less',
            };
        }
        return(
            <div className={styles.notification} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave}>
                {isMouseOver && <TooltipFontIcon isButton className={styles.delete_icon} size={16} value={'delete'} tooltip={'Clear'} onClick={::this.clearNotification}/>}
                {isMouseOver && this.hasExtension() && <TooltipFontIcon isButton className={styles.unfold_icon} size={16} value={unFoldIcon.value} tooltip={unFoldIcon.tooltip} onClick={::this.toggleExtension}/>}
                <div className={styles.title}>
                    {CNotification.getTypeIcon(notification.type)}
                    <span className={styles.title_text}>
                        {title}
                    </span>
                </div>
                <div className={styles.message} style={messageStyles}>
                    <span>{messageData.message}</span>
                    {this.hasExtension() && !isExtended && <div className={styles.transparent_gradient}/>}
                </div>
                <div className={styles.created_time}>
                    {timeAgo}
                </div>
                {::this.renderDialogInDetails()}
            </div>
        );
    }
}

Notification.propTypes = {
    notification: PropTypes.object.isRequired,
}

export default Notification;