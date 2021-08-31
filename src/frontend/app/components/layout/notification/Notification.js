import React from 'react';
import PropTypes from 'prop-types';
import styles from '@themes/default/layout/notification.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


const MAX_NOTIFICATION_MESSAGE_LENGTH = 250;

class Notification extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isExtended: false,
            isMouseOver: false,
        }
    }

    hasExtension(){
        return this.props.notification.message.length > 88;
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


    render(){
        const {isExtended, isMouseOver} = this.state;
        const {notification} = this.props;
        let message = notification.message;
        if(message.length > MAX_NOTIFICATION_MESSAGE_LENGTH){
            message = `${message.substr(0, MAX_NOTIFICATION_MESSAGE_LENGTH)}...`;
        }
        let tooltip = '';
        let value = '';
        let iconClassName = '';
        switch (notification.type){
            case 'info':
                tooltip = 'Info';
                value = 'info';
                iconClassName = styles.info_icon;
                break;
            case 'warning':
                iconClassName = styles.warning_icon;
                break;
            case 'error':
                tooltip = 'Error';
                value = 'cancel';
                iconClassName = styles.error_icon;
                break;
        }
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
                {isMouseOver && <TooltipFontIcon isButton className={styles.delete_icon} size={16} value={'delete'} tooltip={'Clear'}/>}
                {isMouseOver && this.hasExtension() && <TooltipFontIcon isButton className={styles.unfold_icon} size={16} value={unFoldIcon.value} tooltip={unFoldIcon.tooltip} onClick={::this.toggleExtension}/>}
                <div className={styles.title}>
                    {notification.type !== 'warning' ?
                        <TooltipFontIcon wrapClassName={styles.type_icon} className={iconClassName} size={20}
                                         value={value} tooltip={tooltip}/>
                        :
                        <div className={iconClassName}><div>!</div></div>
                    }
                    <span className={styles.title_text}>
                        {notification.title}
                    </span>
                </div>
                <div className={styles.message} style={messageStyles}>
                    <span>{message}</span>
                    {this.hasExtension() && !isExtended && <div className={styles.transparent_gradient}/>}
                </div>
                <div className={styles.created_time}>
                    {notification.createdTime}
                </div>
            </div>
        );
    }
}

Notification.propTypes = {
    notification: PropTypes.object.isRequired,
}

export default Notification;