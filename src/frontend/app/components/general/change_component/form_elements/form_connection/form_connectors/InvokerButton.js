import React, {Component} from 'react';
import PropTypes from 'prop-types';

import styles from '../../../../../../themes/default/general/change_component.scss';



class InvokerButton extends Component{
    constructor(props){
        super(props);

        this.state = {
            isMouseOver: false,
        };
    }

    onMouseOver(){
        this.setState({isMouseOver: true});
    }

    onMouseLeave(){
        this.setState({isMouseOver: false});
    }

    render(){
        const {isMouseOver} = this.state;
        const {tooltip, onClick, position, isOpened} = this.props;
        let className = '';
        switch (position){
            case 'left':
                className = styles.form_connector_invoker_button_from;
                if(isOpened){
                    className += ` ${styles.form_connector_invoker_opened_from}`;
                }
                break;
            case 'right':
                className = styles.form_connector_invoker_button_to;
                if(isOpened){
                    className += ` ${styles.form_connector_invoker_opened_to}`;
                }
                break;
        }
        return(
            <div
                className={className}
                onClick={onClick}
                onMouseOver={::this.onMouseOver}
                onMouseLeave={::this.onMouseLeave}
            >
                <div>{(isMouseOver || isOpened) && !(isMouseOver && isOpened) ? tooltip : 'Docs'}</div>
            </div>
        );
    }
}

InvokerButton.propTypes = {
    tooltip: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    position: PropTypes.string,
    isOpened: PropTypes.bool,
};

InvokerButton.defaultProps = {
    tooltip: '',
    position: 'left',
    isOpened: false,
};

export default InvokerButton;