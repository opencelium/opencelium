import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Select from "@basic_components/inputs/Select";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";


class CreateOperator extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            type: null,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0 && this.state.type !== null)
            || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            this.setState({
                type: null,
            });
        }
    }

    changeType(type){
        this.setState({
            type,
        });
    }

    create(){
        let {type} = this.state;
        type = type.value;
        const {connection, currentItem, updateConnection, setCreateElementPanelPosition, itemPosition} = this.props;
        let operator = {type};
        if (currentItem.connectorType === CONNECTOR_FROM) {
            connection.addFromConnectorOperator(operator, itemPosition);
        } else{
            connection.addToConnectorOperator(operator, itemPosition);

        }
        updateConnection(connection);
        setCreateElementPanelPosition({x: 0, y: 0});
    }

    render(){
        const {type} = this.state;
        const {style, beforeLineStyles, afterLineStyles, createIconStyles} = this.props;
        const typeSource = COperatorItem.getOperatorTypesForSelect();
        return(
            <React.Fragment>
                <Line style={beforeLineStyles}/>
                <div className={styles.create_element_panel_for_item} style={style}>
                    <Select
                        id={'new_operator_type'}
                        name={'new_operator_type'}
                        value={type}
                        onChange={::this.changeType}
                        options={typeSource}
                        closeOnSelect={false}
                        placeholder={'Type'}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                        label={'Type'}
                        className={styles.input_label}
                    />
                </div>
                <Line style={afterLineStyles}/>
                <CreateIcon create={::this.create} style={createIconStyles}/>
            </React.Fragment>
        );
    }
}

export default CreateOperator;