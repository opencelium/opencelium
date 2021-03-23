import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
        currentSubItem: connectionOverview.get('currentSubItem'),
    };
}

@connect(mapStateToProps, {})
class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem, currentSubItem, moveDetails, position} = this.props;
        let details = currentSubItem ? currentSubItem : currentItem;
        return(
            <div className={styles.details}>
                <TooltipFontIcon className={position === 'left' ? styles.position_icon_left : styles.position_icon_right} onClick={moveDetails} tooltip={position === 'left' ? 'Move to the Right' : 'Move to the Left'} value={position === 'left' ? 'keyboard_arrow_right' : 'keyboard_arrow_left'}/>
                <div className={styles.title}>
                    Details
                </div>
                {details ?
                    <div className={styles.label}>
                        {details.label && <React.Fragment><span>Label: {details.label}</span><br/></React.Fragment>}
                        {details.name && <React.Fragment><span>Name: {details.name}</span><br/></React.Fragment>}
                        {details.invoker && `Invoker: ${details.invoker}`}
                    </div>
                    :
                    <div>
                        No item selected
                    </div>
                }
            </div>
        );
    }
}

export default Details;