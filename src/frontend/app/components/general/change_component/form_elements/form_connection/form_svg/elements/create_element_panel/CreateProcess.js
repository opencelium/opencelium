import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Select from "@basic_components/inputs/Select";
import Input from "@basic_components/inputs/Input";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";


class CreateProcess extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: '',
            label: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0 && this.state.name !== '')
            || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            this.setState({
                name: '',
                label: '',
            });
        }
    }

    changeName(name){
        this.setState({
            name,
        });
    }

    changeLabel(label){
        this.setState({
            label,
        });
    }

    create(){
        let {name, label} = this.state;
        name = name.value;
        const {connection, currentItem, updateConnection, setCreateElementPanelPosition, itemPosition, setIsCreateElementPanelOpened} = this.props;
        const connector = connection.getConnectorByType(currentItem.connectorType);
        let method = {name, label};
        let operation = connector.invoker.operations.find(o => o.name === name);
        method.request = operation.request.getObject({bodyOnlyConvert: true});
        method.response = operation.response.getObject({bodyOnlyConvert: true});
        if (currentItem.connectorType === CONNECTOR_FROM) {
            connection.addFromConnectorMethod(method, itemPosition);
        } else {
            connection.addToConnectorMethod(method, itemPosition);
        }
        updateConnection(connection);
        setCreateElementPanelPosition({x: 0, y: 0});
        setIsCreateElementPanelOpened(false);
    }

    render(){
        const {name, label} = this.state;
        const {currentItem, connection, style, beforeLineStyles, afterLineStyles, createIconStyles,} = this.props;
        const connector = connection.getConnectorByType(currentItem.connectorType);
        const nameSource = connector.invoker.operations.map(operation => {
            return {label: operation.name, value: operation.name};
        });
        const isAddDisabled = name === '' || name === null;
        return(
            <React.Fragment>
                <Line style={beforeLineStyles}/>
                <div className={styles.create_element_panel_for_item} style={style}>
                    <Select
                        id={'new_request_name'}
                        name={'new_request_name'}
                        value={name}
                        onChange={::this.changeName}
                        options={nameSource}
                        closeOnSelect={false}
                        placeholder={'Name'}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                        label={'Name'}
                        className={styles.input_label}
                        required={true}
                    />
                    <Input id={'new_request_label'} theme={{input: styles.input_label}} onChange={::this.changeLabel} value={label} label={'Label'}/>
                </div>
                <Line style={afterLineStyles}/>
                <CreateIcon create={::this.create} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

export default CreateProcess;