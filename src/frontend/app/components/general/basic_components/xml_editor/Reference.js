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
        this.props.add();
    }

    render(){
        const {ReferenceComponent} = this.props;
        return (
            <div className={`${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                    <div>
                        <div>{ReferenceComponent.getComponent({submitEdit: ::this.add})}</div>
                    </div>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Value'}</label>
            </div>
        );
    }
}

export default Reference;