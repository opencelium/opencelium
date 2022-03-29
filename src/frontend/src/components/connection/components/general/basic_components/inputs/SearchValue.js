import UpdateParam from "@basic_components/inputs/UpdateParam";
import React from "react";

class SearchValue extends React.Component{
    constructor(props) {
        super(props);
    }


    render(){
        const {id, name, value, type, labelText, selectedConnector, currentConnector, inputValue, updateConnection, paramCallback, onSelectItem, closeMenu, changeInputValue, connection, selectedMethod} = this.props;
        return(
            <div style={{position: 'relative'}}>
                <div style={{width: 'calc(100% - 40px)'}} onMouseDown={value.value !== "-1" ? (e) => onSelectItem(e, {value, type}) : null}>
                    {labelText}
                </div>
                <UpdateParam
                    id={`${id}_param_button`}
                    name={name}
                    selectedMethod={selectedMethod}
                    selectedConnector={selectedConnector}
                    connection={connection}
                    type={type}
                    toggleCallback={(a) => paramCallback(a)}
                    changeInputValue={(a) => changeInputValue(a)}
                    updateConnection={updateConnection}
                    connector={currentConnector}
                    path={inputValue}
                    closeMenu={() => closeMenu()}
                />
            </div>
        );
    }
}

export default SearchValue;