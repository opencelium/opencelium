/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Confirmation from "../../../../../app/Confirmation";

import styles from '@themes/default/general/form_methods.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


/**
 * Delete Icon Component
 */
class DeleteIcon extends Component{

    constructor(props){
        super(props);
        this.state = {
            onDeleteButtonOver: false,
            showConfirm: false,
        };
    }

    /**
     * to show/hide confirmation for delete
     */
    toggleConfirm(){
        this.props.disableMouseForOperator();
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to show delete Icon
     */
    isOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: true});
    }

    /**
     * to hide delete icon
     */
    isNotOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: false});
    }

    /**
     * to remove operator
     */
    removeOperator(){
        let that = this;
        this.toggleConfirm();
        setTimeout(() => {
            that.props.toggleDeleteOperator();
            setTimeout(() => {
                that.props.removeOperator();
            }, 300);
        }, 200);
    }

    render(){
        const {onDeleteButtonOver, showConfirm} = this.state;
        return (
            <div>
                <TooltipFontIcon
                    size={20}
                    isButton={true}
                    className={styles.remove}
                    value={onDeleteButtonOver ? 'delete_forever' : 'delete'}
                    onClick={() => this.toggleConfirm()}
                    onMouseOver={() => this.isOnDeleteButtonOver()}
                    onMouseLeave={() => this.isNotOnDeleteButtonOver()}
                    tooltip={'Delete'}
                />
                <Confirmation
                    okClick={() => this.removeOperator()}
                    cancelClick={() => this.toggleConfirm()}
                    active={showConfirm}
                    title={'Confirmation'}
                    message={'Deletion can influence on the workflow. Do you really want to remove?'}
                />
            </div>
        );
    }
}

DeleteIcon.propTypes = {
    removeOperator: PropTypes.func.isRequired,
    disableMouseForOperator: PropTypes.func.isRequired,
    toggleDeleteOperator: PropTypes.func.isRequired,
};

export default DeleteIcon;