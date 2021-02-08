import React from 'react';
import {isString} from "@utils/app";

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
                const {connector} = this.props;
                let spans = [];
                const requiredInvokerData = connector.invoker.data;
                let stringsWithStartReferences = queryString.split('{');
                if(stringsWithStartReferences.length === 0){
                    return;
                }
                if(stringsWithStartReferences.length > 1){
                    let valueDividedByReferences = [];
                    for(let i = 0; i < stringsWithStartReferences.length; i++){
                        let stringsWithEndReferences = stringsWithStartReferences[i].split('}');
                        if(stringsWithEndReferences.length > 0) {
                            if (stringsWithEndReferences.length === 1) {
                                if (stringsWithEndReferences[0] !== '') {
                                    valueDividedByReferences.push({isReference: false, value: stringsWithEndReferences[0]});
                                }
                            } else {
                                if(stringsWithEndReferences[0].length > 1 && stringsWithEndReferences[0][0] === '%' && stringsWithEndReferences[0][1] === '#'){
                                    valueDividedByReferences.push({isReference: true, isLocalReference: true, value:`{${stringsWithEndReferences[0]}}`});
                                } else{
                                    if(requiredInvokerData.findIndex(item => item === stringsWithEndReferences[0]) === -1){
                                        valueDividedByReferences.push({isReference: true, isFromInvoker: true, isRequiredData: false, value:`{${stringsWithEndReferences[0]}}`});
                                    } else {
                                        valueDividedByReferences.push({isReference: true, isFromInvoker: true, isRequiredData: true, value:`{${stringsWithEndReferences[0]}}`});
                                    }
                                }
                                if(stringsWithEndReferences[1] !== '') {
                                    valueDividedByReferences.push({isReference: false, value: stringsWithEndReferences[1]});
                                }
                            }
                        }
                    }
                    spans = valueDividedByReferences.map(elem => {
                        if (elem.isReference && elem.isFromInvoker && elem.isRequiredData) {
                            return <span style={{color: 'red'}}>{elem.value}</span>;
                        } else {
                            if(elem.isReference && elem.isLocalReference){
                                let pArray = elem.value.split('.');
                                let color = pArray[0];
                                let fieldName = pArray.slice(3, pArray.length).join('.');
                                return <span style={{background:color, width: '20px', padding: '3px', borderRadius: '1px 3px', margin: '3px'}} data-value="param" data-main={`{%${elem.value}%}`}>{fieldName}</span>;
                            } else {
                                return <span>{elem.value}</span>;
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