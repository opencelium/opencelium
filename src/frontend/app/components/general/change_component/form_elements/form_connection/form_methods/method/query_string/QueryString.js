import React from 'react';
import {isString} from "@utils/app";
import {
    InvokerReferenceFromRequiredData,
    LocalReference
} from "@change_component/form_elements/form_connection/form_methods/method/query_string/SpanReferences";
import CEndpoint from "@classes/components/general/change_component/form_elements/CEndpoint";

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
        const {connector, caretPosition} = this.props;
        const requiredInvokerData = connector.invoker.data;
        if(isString(queryString)){
            if(queryString !== ''){
                let spans = [];
                let valueDividedByReferences = CEndpoint.divideEndpointValueByReferences(queryString, requiredInvokerData);
                let selectedReferenceIndex = CEndpoint.isCaretPositionFocusedOnReference(caretPosition, queryString, requiredInvokerData, true);
                if(valueDividedByReferences.length > 0){
                    spans = valueDividedByReferences.map((elem, key) => {
                        if (elem.isInvokerReference) {
                            let valueWithoutBrackets = elem.value.substring(1, elem.value.length - 1);
                            return <InvokerReferenceFromRequiredData isSelected={selectedReferenceIndex === key} key={key} value={valueWithoutBrackets}/>;
                        } else if(elem.isLocalReference){
                            let pArray = elem.value.split('.');
                            let color = pArray[0].substr(2);
                            let fieldName = pArray.slice(3, pArray.length).join('.');
                            fieldName = fieldName.substr(0, fieldName.length - 2);
                            return <LocalReference key={key} isSelected={selectedReferenceIndex === key} color={color} fieldName={fieldName} value={elem.value}/>;
                        } else {
                            return <span key={key}>{elem.value}</span>;
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