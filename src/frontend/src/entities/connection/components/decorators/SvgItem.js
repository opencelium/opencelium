/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React from "react";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";

export function SvgItem(CItem){
    return function (Component) {
        return class extends Component{

            constructor(props) {
                super(props);

                this.state = {
                    showReassignConfirmation: false,
                }
            }

            toggleReassignConfirmation(){
                this.setState({
                    showReassignConfirmation: !this.state.showReassignConfirmation,
                });
            }

            reassign(){
                const item = CItem.getItem(this.props);
                this.assign(item);
                this.toggleReassignConfirmation();
            }

            assign(){
                const {connection, updateConnection, setCurrentBusinessItem} = this.props;
                const item = CItem.getItem(this.props);
                let currentBusinessItem = connection.businessLayout.getCurrentSvgItem();
                if(currentBusinessItem.isExistItem(item)){
                    currentBusinessItem.removeItem(item);
                } else{
                    const assignedBusinessItem = connection.businessLayout.isTechnicalItemAssigned(item);
                    if(assignedBusinessItem) {
                        assignedBusinessItem.removeItem(item);
                    }
                    currentBusinessItem.addItem(item);
                }
                setCurrentBusinessItem(currentBusinessItem.getObject());
                updateConnection(connection);
            }

            render(){
                const {showReassignConfirmation} = this.state;
                return (
                    <React.Fragment>
                        <Component {...this.props} assign={() => this.assign()} reassign={() => this.reassign()} showReassignConfirmation={showReassignConfirmation} toggleReassignConfirmation={() => this.toggleReassignConfirmation()}/>
                        <Confirmation
                            okClick={() => this.reassign()}
                            cancelClick={() => this.toggleReassignConfirmation()}
                            active={showReassignConfirmation}
                            title={'Confirmation'}
                            message={'It is already assigned. Do you want to reassign it to current one?'}
                        />
                    </React.Fragment>
                );
            }
        };
    };
}