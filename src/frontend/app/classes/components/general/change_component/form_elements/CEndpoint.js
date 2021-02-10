import {colorRegex} from "@utils/constants/regular_expressions";

export default class CEndpoint{
    static divideEndpointValueByReferences(endpointValue, requiredInvokerData){
        let valueDividedByReferences = [];
        let stringsWithStartReferences = endpointValue.split('{%');
        if(endpointValue === '' || stringsWithStartReferences.length === 0){
            return [];
        }
        if(stringsWithStartReferences.length > 1){
            for(let i = 0; i < stringsWithStartReferences.length; i++){
                if(stringsWithStartReferences[i] !== '') {
                    let stringsWithEndReferences = stringsWithStartReferences[i].split('%}');
                    if (stringsWithEndReferences.length > 0) {
                        if (stringsWithEndReferences.length === 1) {
                            if (stringsWithEndReferences[0] !== '') {
                                valueDividedByReferences.push(...CEndpoint.splitInvokerReferences(stringsWithEndReferences[0], requiredInvokerData));
                            }
                        } else {
                            const colorRegExp = new RegExp(colorRegex, 'g');
                            const isColorFormatCorrect = colorRegExp.test(stringsWithEndReferences[0].substr(0, 7));
                            if (stringsWithEndReferences[0].length > 1 && isColorFormatCorrect) {
                                valueDividedByReferences.push({
                                    isLocalReference: true,
                                    value: `{%${stringsWithEndReferences[0]}%}`
                                });
                            } else{
                                valueDividedByReferences.push(...CEndpoint.splitInvokerReferences(`{%${stringsWithEndReferences[0]}%}`, requiredInvokerData));
                            }
                            if (stringsWithEndReferences[1] !== '') {
                                valueDividedByReferences.push(...CEndpoint.splitInvokerReferences(stringsWithEndReferences[1], requiredInvokerData));
                            }
                        }
                    }
                }
            }
        } else{
            valueDividedByReferences.push(...CEndpoint.splitInvokerReferences(stringsWithStartReferences[0], requiredInvokerData));
        }
        return valueDividedByReferences;
    }

    static splitInvokerReferences(endpointSubstring, requiredInvokerData = []){
        let splitResult = [];
        let splitResultWithInfelicity = [];
        if(requiredInvokerData.length === 0){
            return [{value: endpointSubstring}];
        }
        let splitStartReference = endpointSubstring.split('{');
        for(let i = 0; i < splitStartReference.length; i++){
            let isReference = false;
            if(splitStartReference[i] === ''){
                continue;
            }
            let value = i === 0 && endpointSubstring[0] !== '{' ? splitStartReference[i] : `{${splitStartReference[i]}`;
            for(let j = 0; j < requiredInvokerData.length; j++){
                let possibleReference = splitStartReference[i].substr(0, requiredInvokerData[j].length + 1);
                if(possibleReference === `${requiredInvokerData[j]}}`){
                    value = value.substr(0, requiredInvokerData[j].length + 2);
                    splitResultWithInfelicity.push({isInvokerReference: true, value});
                    value = splitStartReference[i].substr(requiredInvokerData[j].length + 1);
                    if(value !== '') {
                        splitResultWithInfelicity.push({value});
                    }
                    isReference = true;
                    break;
                }
            }
            if(!isReference){
                splitResultWithInfelicity.push({isInvokerReference: false, value});
            }
        }
        let tmpValue = '';
        for(let i = 0; i < splitResultWithInfelicity.length; i++){
            if(splitResultWithInfelicity[i].isInvokerReference){
                if(tmpValue !== ''){
                    splitResult.push({value: tmpValue});
                    tmpValue = '';
                }
                splitResult.push({isInvokerReference: true, value: splitResultWithInfelicity[i].value});
            } else{
                tmpValue += splitResultWithInfelicity[i].value;
                if(i === splitResultWithInfelicity.length - 1){
                    splitResult.push({value: tmpValue});
                }
            }
        }
        return splitResult;
    }

    static isCaretPositionFocusedOnReference(caretPosition = 0, endpointValue = '', requiredInvokerData = [], shouldReturnIndex = false){
        let dividedByReferences = CEndpoint.divideEndpointValueByReferences(endpointValue, requiredInvokerData);
        for(let i = 0; i < dividedByReferences.length; i++){
            if(caretPosition <= 0){
                if(i === 0 && (dividedByReferences[0].isInvokerReference || dividedByReferences[0].isLocalReference)){
                    if(shouldReturnIndex){
                        return 0;
                    }
                    return true;
                }
                break;
            }
            if(dividedByReferences[i].isInvokerReference){
                caretPosition -= dividedByReferences[i].value.length - 2;
                if(caretPosition <= 0){
                    if(shouldReturnIndex){
                        return i;
                    }
                    return true;
                }
            } else if(dividedByReferences[i].isLocalReference){
                let value = dividedByReferences[i].value.split('.').slice(3).join('.');
                value = value.substr(0, value.length - 2);
                caretPosition -= value.length;
                if(caretPosition <= 0){
                    if(shouldReturnIndex){
                        return i;
                    }
                    return true;
                }
            } else{
                caretPosition -= dividedByReferences[i].value.length;
            }
        }
        if(shouldReturnIndex){
            return -1;
        }
        return false;
    }
}