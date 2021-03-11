import React, {Component} from 'react';
import styles from "@themes/default/general/form_methods";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


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
            <ToolboxThemeInput label={translate('XML_EDITOR.TAG.TYPE.REFERENCE_VALUE')} inputElementClassName={styles.multiselect_label}>
                <div style={{position: 'relative'}}>{ReferenceComponent.getComponent({submitEdit: ::this.add, selectId: id})}</div>
            </ToolboxThemeInput>
        );
    }
}

export default Reference;