import React from 'react';
import styles from "@themes/default/general/form_methods";
import SelectSearch from "@basic_components/inputs/SelectSearch";
import PropertyInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/PropertyInput";

class ParamInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, param, style, id, hasMethod, connector, items, updateParam, isMultiline, updateConnection} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        return (
            <div style={style}>
                <SelectSearch
                    id={id}
                    updateConnection={updateConnection}
                    className={styles.operator_left_field}
                    placeholder={'param'}
                    items={items}
                    readOnly={readOnly}
                    doAction={updateParam}
                    onInputChange={updateParam}
                    inputValue={param}
                    currentConnector={connector}
                    isPopupMultiline={isMultiline}
                    popupRows={isMultiline ? 4 : 1}
                    dropdownClassName={styles.param_input_dropdown}
                />
            </div>
        );
    }
}

export default ParamInput;