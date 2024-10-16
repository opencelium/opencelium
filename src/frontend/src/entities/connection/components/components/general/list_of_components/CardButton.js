/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {permission} from "@entity/connection/components/decorators/permission";
import {formatHtmlId} from "@application/utils/utils";
import styles from "@entity/connection/components/themes/default/general/list_of_components.scss";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import Loading from "@entity/connection/components/components/general/app/Loading";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}


/**
 * Button Component for Card
 */
@connect(mapStateToProps, {})
@permission()
class CardButton extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {className, onClick, text, index, hasTab, type} = this.props;
        let id = formatHtmlId(`button_${text}_${index}`);
        let value = '';
        let tooltip = '';
        switch (type){
            case 'view':
                value = 'visibility';
                tooltip = 'View';
                break;
            case 'update':
                value = 'edit';
                tooltip = 'Update';
                break;
            case 'delete':
                value = 'delete';
                tooltip = 'Delete';
                break;
        }
        if(hasTab) {
            return (
                <React.Fragment>
                    {value && <TooltipFontIcon wrapClassName={`${className} ${styles.card_button_icon}`} size={'3vw'} tooltip={tooltip} value={value} onClick={onClick} id={id} isButton={true} turquoiseTheme/>}
                    {type !== 'loading' &&
                        <button className={`${styles.card_button} ${className}`} onClick={onClick} id={id}>
                            <div>{text}</div>
                        </button>
                    }
                    {type === 'loading' &&
                        <Loading className={className}/>
                    }
                </React.Fragment>
            );
        } else{
            return (
                <div className={className} onClick={onClick} id={id}>{text}</div>
            );
        }
    }
}

CardButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hasTab: PropTypes.bool,
};

CardButton.defaultProps = {
    hasTab: true,
    className: '',
    onClick: null,
};

export default CardButton;