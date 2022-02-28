import React from 'react';
import styles from "@themes/default/general/form_methods";
import SelectSearch from "@basic_components/inputs/SelectSearch";

class ParamInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, param, style, id, connector, items, updateParam, isMultiline, updateConnection, selectedMethod, selectedConnector, connection} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        return (
            <div style={style}>
                <SelectSearch
                    id={id}
                    selectedMethod={selectedMethod}
                    selectedConnector={selectedConnector}
                    updateConnection={updateConnection}
                    connection={connection}
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