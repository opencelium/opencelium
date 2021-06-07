import React from 'react';
import PropTypes from 'prop-types';
import Select from "@basic_components/inputs/Select";
import {RESPONSE_SUCCESS} from "@classes/components/content/invoker/response/CResponse";

class MethodSelect extends React.Component{
    constructor(props) {
        super(props);
    }

    /**
     * to change color
     */
    update(method){
        const {updateMethod} = this.props;
        updateMethod(method);
    }

    render(){
        const {method, style, source, hasValue, placeholder, isDisabled, isSearchable} = this.props;
        return (
            <div style={style}>
                <Select
                    name={'method'}
                    value={method}
                    onChange={::this.update}
                    options={source}
                    closeOnSelect={false}
                    placeholder={placeholder}
                    isDisabled={isDisabled}
                    isSearchable={isSearchable}
                    openMenuOnClick={true}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    styles={{
                        container: (provided, {isFocused, isDisabled}) => ({
                            fontSize: '12px',
                            borderBottom: isFocused && !isDisabled ? '2px solid #3f51b5 !important' : 'none',
                        }),
                        control: styles => ({
                            ...styles,
                            borderRadius: 0,
                            border: 'none',
                            borderBottom: '1px solid rgba(33, 33, 33, 0.12)',
                            boxShadow: 'none',
                            backgroundColor: 'initial'
                        }),
                        dropdownIndicator: () => ({display: 'none'}),
                        menu: (styles, {isDisabled}) => {
                            let s = {
                                ...styles,
                                top: 'auto',
                                marginTop: '-16px',
                                marginBottom: '8px',
                                width: '200px',
                                zIndex: '2',
                            };
                            if(isDisabled || source.length === 0){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        valueContainer: (styles) => {
                            return{
                                ...styles,
                                padding: hasValue ? 0 : '2px 8px',
                            };
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        },
                        placeholder: (styles) => {
                            return{
                                ...styles,
                                textAlign: 'center',
                                width: '70%',
                            };
                        }
                    }}
                />
            </div>
        );
    }
}

MethodSelect.propTypes = {
    readOnly: PropTypes.bool,
    hasValue: PropTypes.bool,
    source: PropTypes.array.isRequired,
    updateMethod: PropTypes.func.isRequired,
    style: PropTypes.object,
};

MethodSelect.defaultProps = {
    readOnly: false,
    hasValue: false,
    style: {},
};

export default MethodSelect;