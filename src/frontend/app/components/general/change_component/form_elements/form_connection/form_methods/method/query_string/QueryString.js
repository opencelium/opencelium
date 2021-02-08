import React from 'react';
import {isString} from "@utils/app";
import {
    InvokerReference,
    InvokerReferenceFromRequiredData,
    LocalReference
} from "@change_component/form_elements/form_connection/form_methods/method/query_string/SpanReferences";

class QueryString extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            spans: this.embraceWithSpans(props.query),
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.query !== this.props.query){
            this.setState({spans: this.embraceWithSpans(this.props.query)});
        }
    }

    embraceWithSpans(queryString){
        if(isString(queryString)){
            if(queryString !== ''){
                const {divideEndpointValueByReferences} = this.props;
                let spans = [];
                let valueDividedByReferences = divideEndpointValueByReferences(queryString);
                if(valueDividedByReferences.length > 1){
                    spans = valueDividedByReferences.map((elem, key) => {
                        let valueWithoutBrackets = elem.value.substring(1, elem.value.length - 1);
                        if (elem.isReference && elem.isFromInvoker && elem.isRequiredData) {
                            return <InvokerReferenceFromRequiredData key={key} value={valueWithoutBrackets}/>;
                        } else {
                            if(elem.isReference && elem.isFromInvoker && !elem.isRequiredData){
                                return <InvokerReference key={key} value={valueWithoutBrackets}/>;
                            } else if(elem.isReference && elem.isLocalReference){
                                let pArray = elem.value.split('.');
                                let color = pArray[0].substr(2);
                                let fieldName = pArray.slice(3, pArray.length).join('.');
                                fieldName = fieldName.substr(0, fieldName.length - 2);
                                return <LocalReference key={key} color={color} fieldName={fieldName} value={elem.value}/>;
                            } else {
                                return <span key={key}>{elem.value}</span>;
                            }
                        }
                    });
                }
                return spans;
            }
        }
        return [];
    }

    render(){
        const spans = this.state.spans.map(span => span);
        return (
            <React.Fragment>
                {spans}
            </React.Fragment>
        );
    }
}

export default QueryString;