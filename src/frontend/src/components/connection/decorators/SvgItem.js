import React from "react";
import Confirmation from "@components/general/app/Confirmation";

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