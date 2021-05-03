import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import Input from "@basic_components/inputs/Input";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {setFocusById} from "@utils/app";
import {setItems, setArrows} from "@actions/connection_overview_2/set";
import {connect} from "react-redux";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        items: connectionOverview.get('items').toJS(),
        currentItem: connectionOverview.get('currentItem'),
    };
}

@connect(mapStateToProps, {setArrows, setItems})
class CreateElementPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            type: '',
            name: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.x === 0 && this.props.y === 0 && (this.state.type !== '' || this.state.name !== '')){
            this.setState({
                type: '',
                name: '',
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

    createElement(){
        const {name} = this.state;
        const {items, currentItem} = this.props;
        let index = items.findIndex(i => i.id === currentItem.id);
        if(index !== -1) {
            items.splice(index, 0, {id: 5, name, x: currentItem.x + 150,y: currentItem.y});
            this.props.setItems(items);
            this.props.setArrows([
                {from: 1, to: 2},
                {from: 2, to: 3},
                {from: currentItem.id, to: 5},
            ]);
        }
    }

    render(){
        const {type, name} = this.state;
        const {x, y, currentItem} = this.props;
        if(currentItem === null || x === 0 && y === 0){
            return null;
        }
        return(
            <div>
                <div className={styles.create_element_panel} style={{top: `${y}px`, left: `${x}px`}}>
                    <div className={`${styles.item} ${type === 'request' ? styles.selected_item : ''}`} onClick={() => ::this.changeType('request')}>Request</div>
                    <div className={`${styles.item} ${type === 'operator' ? styles.selected_item : ''}`} onClick={() => ::this.changeType('operator')}>Operator</div>
                </div>
                {type === 'request' &&
                    <React.Fragment>
                        <div className={styles.create_element_panel_line} style={{top: `${y + 33}px`, left: `${x + 100}px`}}/>
                        <div className={styles.create_element_panel} style={{top: `${y}px`, left: `${x + 120}px`}}>
                            <Input id={'new_request_name'} theme={{input: styles.input_name}} onChange={::this.changeName} value={name} label={'Name'}/>
                        </div>
                        <div className={styles.create_element_panel_line} style={{top: `${y + 33}px`, left: `${x + 220}px`}}/>
                        <TooltipFontIcon onClick={::this.createElement} wrapStyles={{top: `${y + 22}px`, left: `${x + 240}px`}} wrapClassName={styles.add_icon} tooltip={'Create'} value={'add_circle_do_outline'}  isButton={true} />
                    </React.Fragment>
                }
            </div>
        );
    }
}

export default CreateElementPanel;