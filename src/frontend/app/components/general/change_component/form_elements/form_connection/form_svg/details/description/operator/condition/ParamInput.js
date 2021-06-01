import React from 'react';
import styles from "@themes/default/general/form_methods";
import SelectSearch from "@basic_components/inputs/SelectSearch";

class ParamInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, param, style, id, hasMethod, connector, items, updateParam, isMultiline} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        return (
            <div style={style}>
                <SelectSearch
                    id={id}
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
                />
            </div>
        );
    }
}

export default ParamInput;