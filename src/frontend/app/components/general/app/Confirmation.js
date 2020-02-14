/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from 'react-i18next';

import styles from '../../../themes/default/general/app.scss';
import Dialog from "../basic_components/Dialog";


/**
 * Confirmation Component
 */
@withTranslation('app')
class Confirmation extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, okClick, cancelClick, active, title, message} = this.props;
        let {onEscKeyDown, onOverlayClick} = this.props;
        const actions = [
            {label: t('CONFIRMATION.OK'), onClick: okClick, tabIndex: 2},
            {label: t('CONFIRMATION.CANCEL'), onClick: cancelClick, autoFocus: true, tabIndex: 1},
        ];
        if(onEscKeyDown === null){
            onEscKeyDown = cancelClick;
        }
        if(onOverlayClick === null){
            onOverlayClick = cancelClick;
        }
        return (
            <Dialog
                actions={actions}
                active={active}
                onEscKeyDown={onEscKeyDown}
                onOverlayClick={onOverlayClick}
                title={title}
                theme={{wrapper: styles.confirmation_wrapper}}
            >
                <p>{message}</p>
            </Dialog>
        );
    }
}

Confirmation.propTypes = {
    okClick: PropTypes.func.isRequired,
    cancelClick: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
    onEscKeyDown: PropTypes.func,
    onOverlayClick: PropTypes.func,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
};

Confirmation.defaultProps = {
    onEscKeyDown: null,
    onOverlayClick: null,
};

export default Confirmation;