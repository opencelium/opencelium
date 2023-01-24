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

import React from 'react';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";

class DeleteIcon extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isConfirmationShown: false,
        };
    }

    toggleConfirmation(){
        this.setState({
            isConfirmationShown: !this.state.isConfirmationShown,
        })
    }

    onClick(e){
        const {onClick} = this.props;
        onClick(e);
        this.toggleConfirmation();
    }

    render(){
        const {isConfirmationShown} = this.state;
        const {svgX, svgY, x, y} = this.props;
        return(
            <svg x={svgX} y={svgY}>
                <path id={'delete_icon'} className={styles.process_delete} x={x} y={y} onClick={(a) => this.toggleConfirmation(a)} xmlns="http://www.w3.org/2000/svg" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z">
                    <title>{'Delete'}</title>
                </path>
                <Confirmation
                    okClick={(a) => this.onClick(a)}
                    cancelClick={(a) => this.toggleConfirmation(a)}
                    active={isConfirmationShown}
                    title={'Confirmation'}
                    message={'Do you really want to delete?'}
                />
            </svg>
        );
    }
}

DeleteIcon.defaultProps = {
    svgX: 0,
    svgY: 0,
    x: 0,
    y: 0,
};

export default DeleteIcon;