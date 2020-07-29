import React from 'react';
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@themes/default/general/form_methods";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class Reference extends React.Component{
    constructor(props) {
        super(props);
    }

    add(){
        const {ReferenceComponent} = this.props;
        ReferenceComponent.self.current.setIdValue();
        this.props.add(false);
    }

    render(){
        const {ReferenceComponent} = this.props;
        return (
            <div className={`${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                    <div>
                        <div style={{width: '220px'}}>{ReferenceComponent.getComponent({})}</div>
                        <TooltipFontIcon tooltip={'Add Reference'} value={'add'} onClick={::this.add} style={{cursor: 'pointer', fontSize: '14px', lineHeight: '38px'}}/>
                    </div>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Value'}</label>
            </div>
        );
    }
}

export default Reference;