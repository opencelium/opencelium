import React, {Component} from 'react';
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@themes/default/general/form_methods";


/**
 * Reference component to display reference value
 */
class Reference extends Component{
    constructor(props) {
        super(props);
    }

    /**
     * to add reference
     */
    add(){
        const {ReferenceComponent} = this.props;
        ReferenceComponent.self.current.setIdValue();
        this.props.add();
    }

    render(){
        const {id, translate, ReferenceComponent} = this.props;
        return (
            <div className={`${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                    <div>
                        <div>{ReferenceComponent.getComponent({submitEdit: ::this.add, selectId: id})}</div>
                    </div>
                <span className={theme.bar}/>
                <label className={theme.label}>{translate('XML_EDITOR.TAG.TYPE.REFERENCE_VALUE')}</label>
            </div>
        );
    }
}

export default Reference;