/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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