import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Input from "@basic_components/inputs/Input";
import {
    Line,
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import {CreateIcon} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateIcon";
import {setFocusById} from "@utils/app";
import {connect} from "react-redux";
import {setCurrentBusinessItem} from "@actions/connection_overview_2/set";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import CCreateElementPanel from "@classes/components/content/connection_overview_2/CCreateElementPanel";


@connect(null, {setCurrentBusinessItem})
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
        let currentCoordinates = CCreateElementPanel.getCoordinates(this.props);
        let prevCoordinates = CCreateElementPanel.getCoordinates(prevProps);
        if((currentCoordinates.x === 0 && currentCoordinates.y === 0) || prevCoordinates.x !== currentCoordinates.x || prevCoordinates.y !== currentCoordinates.y){
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
        const {name} = this.state;
        const {connection, updateConnection, setCreateElementPanelPosition, setIsCreateElementPanelOpened, setCurrentBusinessItem} = this.props;
        const currentSvgItem = connection.businessLayout.getCurrentSvgItem();
        const x = currentSvgItem ? currentSvgItem.x + currentSvgItem.width + 20 : 100;
        const y = currentSvgItem ? currentSvgItem.y : 100;
        connection.businessLayout.addItem({name, x, y});
        updateConnection(connection);
        setCurrentBusinessItem(connection.businessLayout.getCurrentSvgItem());
        if(setCreateElementPanelPosition) setCreateElementPanelPosition({x: 0, y: 0});
        if(setIsCreateElementPanelOpened) setIsCreateElementPanelOpened(false);
    }

    render(){
        const {name} = this.state;
        let {connection, isTypeCreateOperator} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const isInitialState = connection.businessLayout.getItems().length === 0;
        if(!isInitialState){
            y -= 100;
        }
        let {createIconStyles, afterItemLineStyles, panelItemStyles} = CBusinessProcess.getCreateElementPanelStyles(x, y, {isTypeCreateOperator});
        const isAddDisabled = name === '';
        return(
            <React.Fragment>
                <div className={styles.create_element_panel_for_item} style={panelItemStyles}>
                    <Input id={'new_business_item_name'} theme={{input: styles.input_label}} onChange={::this.changeName} value={name} label={'Name'}/>
                </div>
                <Line style={afterItemLineStyles}/>
                <CreateIcon create={::this.create} style={createIconStyles} isDisabled={isAddDisabled}/>
            </React.Fragment>
        );
    }
}

export default CreateBusinessItem;