import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Select from "@basic_components/inputs/Select";
import Input from "@basic_components/inputs/Input";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import {setFocusById} from "@utils/app";


class CreateBusinessItem extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: '',
        }
    }

    componentDidMount() {
        setFocusById('new_business_item_name');
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0) || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            if(this.state.name !== '') {
                this.setState({
                    name: '',
                });
            }
        }
    }

    changeName(name){
        this.setState({
            name,
        });
    }

    create(){
        let {name} = this.state;
        name = name.value;
        const {connection, updateConnection, setCreateElementPanelPosition, itemPosition, setIsCreateElementPanelOpened, connectorType} = this.props;
        const connector = connection.getConnectorByType(connectorType);
        let method = {name, label};
        let operation = connector.invoker.operations.find(o => o.name === name);
        method.request = operation.request.getObject({bodyOnlyConvert: true});
        method.response = operation.response.getObject({bodyOnlyConvert: true});
        if (connectorType === CONNECTOR_FROM) {
            connection.addFromConnectorMethod(method, itemPosition);
        } else {
            connection.addToConnectorMethod(method, itemPosition);
        }
        updateConnection(connection);
        if(setCreateElementPanelPosition) setCreateElementPanelPosition({x: 0, y: 0});
        if(setIsCreateElementPanelOpened) setIsCreateElementPanelOpened(false);
    }

    render(){
        const {name} = this.state;
        const {style, afterLineStyles, createIconStyles} = this.props;
        const isAddDisabled = name === '' || name === null;
        return(
            <React.Fragment>
                <div className={styles.create_element_panel_for_item} style={style}>
                    <Input id={'new_business_item_name'} theme={{input: styles.input_label}} onChange={::this.changeName} value={name} label={'Name'}/>
                </div>
                <Line style={afterLineStyles}/>
                <CreateIcon create={::this.create} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

export default CreateBusinessItem;