import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Input from "@basic_components/inputs/Input";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {setFocusById} from "@utils/app";
import {setItems, setArrows} from "@actions/connection_overview_2/set";
import {connect} from "react-redux";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import Select from "@basic_components/inputs/Select";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentSubItem} = mapItemsToClasses(state);
    return{
        items: connectionOverview.get('items').toJS(),
        currentSubItem,
    };
}

@connect(mapStateToProps, {setArrows, setItems})
class CreateElementPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            type: '',
            name: '',
            label: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0 && (this.state.type !== '' || this.state.name !== ''))
        || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            this.setState({
                type: '',
                name: '',
                label: '',
            });
        }
    }

    changeType(type){
        if(type === 'request'){
            setFocusById('new_request_name');
        }
        this.setState({
            type,
        });
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

    createElement(){
        const {label, type} = this.state;
        const name = this.state.name.value;
        const {connection, currentItem, updateConnection, setCreateElementPanelPosition} = this.props;
        const isMethodItem = currentItem.entity instanceof CMethodItem;
        const isOperatorItem = currentItem.entity instanceof COperatorItem;
        const connector = connection.getConnectorByType(currentItem.connectorType);
        switch(type){
            case 'request':
                let method = {name, label};
                let operation = connector.invoker.operations.find(o => o.name === name);
                method.request = operation.request.getObject({bodyOnlyConvert: true});
                method.response = operation.response.getObject({bodyOnlyConvert: true});
                if (currentItem.connectorType === CONNECTOR_FROM) {
                    connection.addFromConnectorMethod(method);
                } else {
                    connection.addToConnectorMethod(method);
                }
                break;
            case 'operator':
                break;
        }
        updateConnection(connection);
        setCreateElementPanelPosition({x: 0, y: 0});
    }

    render(){
        const {type, name, label} = this.state;
        const {x, y, currentSubItem, connection} = this.props;
        if(currentSubItem === null || x === 0 && y === 0){
            return null;
        }
        const connector = connection.getConnectorByType(currentSubItem.connectorType);
        const nameSource = connector.invoker.operations.map(operation => {
            return {label: operation.name, value: operation.name};
        });
        return(
            <div>
                <div className={styles.create_element_panel} style={{top: `${y}px`, left: `${x}px`}}>
                    <div className={`${styles.item} ${type === 'request' ? styles.selected_item : ''}`} onClick={() => ::this.changeType('request')}>Request</div>
                    <div className={`${styles.item} ${type === 'operator' ? styles.selected_item : ''}`} onClick={() => ::this.changeType('operator')}>Operator</div>
                </div>
                {type === 'request' &&
                    <React.Fragment>
                        <div className={styles.create_element_panel_line} style={{top: `${y + 33}px`, left: `${x + 200}px`}}/>
                        <div className={styles.create_element_panel} style={{top: `${y - 25}px`, left: `${x + 220}px`}}>
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
                            />
                            <Input id={'new_request_label'} theme={{input: styles.input_label}} onChange={::this.changeLabel} value={label} label={'Label'}/>
                        </div>
                        <div className={styles.create_element_panel_line} style={{top: `${y + 33}px`, left: `${x + 420}px`}}/>
                        <TooltipFontIcon onClick={::this.createElement} wrapStyles={{top: `${y + 22}px`, left: `${x + 440}px`}} wrapClassName={styles.add_icon} tooltip={'Create'} value={'add_circle_do_outline'}  isButton={true} />
                    </React.Fragment>
                }
            </div>
        );
    }
}

export default CreateElementPanel;