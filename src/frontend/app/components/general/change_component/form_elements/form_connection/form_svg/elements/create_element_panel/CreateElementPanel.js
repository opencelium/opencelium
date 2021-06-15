import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import {setFocusById} from "@utils/app";
import {setItems, setArrows} from "@actions/connection_overview_2/set";
import {connect} from "react-redux";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import CreateProcess
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateProcess";
import CreateOperator
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateOperator";
import {INSIDE_ITEM, OUTSIDE_ITEM} from "@classes/components/content/connection/CConnectorItem";
import {
    Line
} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";

const CREATE_PROCESS = 'CREATE_PROCESS';
const CREATE_OPERATOR = 'CREATE_OPERATOR';

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        items: connectionOverview.get('items').toJS(),
    };
}

@connect(mapStateToProps, {setArrows, setItems,})
class CreateElementPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            type: CREATE_PROCESS,
            itemPosition: OUTSIDE_ITEM,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.x === 0 && this.props.y === 0 && this.state.type !== CREATE_PROCESS)
        || prevProps.x !== this.props.x || prevProps.y !== this.props.y){
            this.setState({
                type: CREATE_PROCESS,
                itemPosition: OUTSIDE_ITEM,
            });
        }
    }

    changeType(type){
        if(type === CREATE_PROCESS){
            setFocusById('new_request_name');
        }
        this.setState({
            type,
        });
    }

    onChangeItemPosition(itemPosition){
        this.setState({
            itemPosition,
        })
    }

    render(){
        const {type, itemPosition} = this.state;
        const {x, y, currentItem, isCreateElementPanelOpened} = this.props;
        if(!isCreateElementPanelOpened || (x === 0 && y === 0)){
            return null;
        }
        let isMethodItem = currentItem && currentItem.entity instanceof CMethodItem;
        const isOperatorItem = currentItem && currentItem.entity instanceof COperatorItem;
        if(!isMethodItem && !isOperatorItem){
            isMethodItem = true;
        }
        const itemPositionLine = {top: `${y + 27}px`, left: `${x - 7}px`};
        const itemTypeLine = isMethodItem ? {top: `${y + 33}px`, left: `${x - 7}px`} : {top: `${y + 26}px`, left: `${x + 111}px`};
        const beforeItemLineStyles = isMethodItem ? {top: `${y + 34}px`, left: `${x + 111}px`} : {top: `${y + 27}px`, left: `${x + 230}px`};
        const afterItemLineStyles = isMethodItem ? {top: `${y + 34}px`, left: `${x + 330}px`} : {top: `${y + 27}px`, left: `${x + 450}px`};
        const createIconStyles = isMethodItem ? {top: `${y + 23}px`, left: `${x + 350}px`} : {top: `${y + 17}px`, left: `${x + 468}px`};
        const panelItemPositionStyles = {top: `${y - 7}px`, left: `${x + 12}px`};
        const panelItemTypeStyles = isMethodItem ? {top: `${y}px`, left: `${x + 12}px`} : {top: `${y - 7}px`, left: `${x + 130}px`};
        let panelItemStyles = isMethodItem ? {top: y - 24, left: `${x + 130}px`} : {top: y - 31, left: `${x + 250}px`};
        if(type === CREATE_OPERATOR){
            panelItemStyles.top += 28;
        }
        panelItemStyles.top += 'px';
        return(
            <div>
                {isOperatorItem &&
                <React.Fragment>
                    {/*<Line style={itemPositionLine}/>*/}
                    <div className={styles.create_element_panel} style={panelItemPositionStyles}>
                        <div className={`${styles.item} ${itemPosition === OUTSIDE_ITEM ? styles.selected_item : ''}`}
                             onClick={() => ::this.onChangeItemPosition(OUTSIDE_ITEM)}>Out
                        </div>
                        <div className={`${styles.item} ${itemPosition === INSIDE_ITEM ? styles.selected_item : ''}`}
                             onClick={() => ::this.onChangeItemPosition(INSIDE_ITEM)}>In
                        </div>
                    </div>
                </React.Fragment>
                }
                {isMethodItem || (isOperatorItem && itemPosition !== '') ?
                    <React.Fragment>
                        {/*<Line style={itemTypeLine}/>*/}
                        <div className={styles.create_element_panel} style={panelItemTypeStyles}>
                            <div className={`${styles.item} ${type === CREATE_PROCESS ? styles.selected_item : ''}`}
                                 onClick={() => ::this.changeType(CREATE_PROCESS)}>
                                {'Process'}
                            </div>
                            <div className={`${styles.item} ${type === CREATE_OPERATOR ? styles.selected_item : ''}`}
                                 onClick={() => ::this.changeType(CREATE_OPERATOR)}>
                                {'Operator'}
                            </div>
                        </div>
                    </React.Fragment>
                    : null
                }
                {type === CREATE_PROCESS && ((isOperatorItem && itemPosition !== '') || isMethodItem) ?
                    <CreateProcess
                        {...this.props}
                        style={panelItemStyles}
                        itemPosition={itemPosition}
                        beforeLineStyles={beforeItemLineStyles}
                        afterLineStyles={afterItemLineStyles}
                        createIconStyles={createIconStyles}
                    />
                    : null
                }
                {type === CREATE_OPERATOR && ((isOperatorItem && itemPosition !== '') || isMethodItem) ?
                    <CreateOperator
                        {...this.props}
                        style={panelItemStyles}
                        itemPosition={itemPosition}
                        beforeLineStyles={beforeItemLineStyles}
                        afterLineStyles={afterItemLineStyles}
                        createIconStyles={createIconStyles}
                    />
                    : null
                }
            </div>
        );
    }
}

export default CreateElementPanel;