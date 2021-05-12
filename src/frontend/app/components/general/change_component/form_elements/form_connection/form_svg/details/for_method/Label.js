import React from 'react';
import {Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class Label extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMouseOver: false,
            isEditOn: false,
        }
    }

    mouseOver(){
        this.setState({
            isMouseOver: true,
        });
    }

    mouseLeave(){
        this.setState({
            isMouseOver: false,
        });
    }

    toggleEdit(){
        this.setState({
            isEditOn: this.state.isEditOn,
        });
    }

    render(){
        const {isMouseOver} = this.state;
        const {details} = this.props;
        let label = details && isString(details.label) ? details.label : '';
        if(label === '') label = 'is empty';
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{`Label`}</Col>
                <Col xs={8} className={styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    <span>{label}</span>
                    {isMouseOver && <TooltipFontIcon className={styles.edit_icon} size={14} isButton={true} tooltip={'Edit'} value={'edit'} onClick={::this.toggleEdit}/>}
                </Col>
            </React.Fragment>
        );
    }
}

export default Label;