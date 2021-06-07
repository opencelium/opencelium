import React from 'react';
import styles from "@themes/default/general/form_methods";
import SelectSearch from "@basic_components/inputs/SelectSearch";

class PropertyInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, style, equalStyle, predicator, id, updateProperty, items, connector, property} = this.props;
        return (
            <React.Fragment>
                <div style={style}>
                    <SelectSearch
                        id={id}
                        className={styles.operator_right_field}
                        placeholder={'param'}
                        items={items}
                        readOnly={readOnly}
                        doAction={updateProperty}
                        onInputChange={updateProperty}
                        inputValue={property}
                        predicator={predicator}
                        currentConnector={connector}
                        dropdownClassName={styles.param_input_dropdown}
                    />
                </div>
                <div className={styles.property_input_right_equal} style={equalStyle}>
                    =
                </div>
            </React.Fragment>
        );
    }
}

export default PropertyInput;