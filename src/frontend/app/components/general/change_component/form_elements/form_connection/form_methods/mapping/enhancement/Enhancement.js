/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import Variables from "./Variables";
import Constants from "./Constants";
import Operators from "./Operators";
import Editor from "./Editor";

import 'brace/mode/javascript';
import 'brace/theme/tomorrow';

import {Row, Col} from "react-grid-system";

import styles from '../../../../../../../../themes/default/general/enhancement.scss';
import Input from '../../../../../../basic_components/inputs/Input';
import CEnhancement from "../../../../../../../../classes/components/content/connection/field_binding/CEnhancement";
import {setFocusById} from "../../../../../../../../utils/app";


/**
 * Enhancement Component
 */
class Enhancement extends Component{

    constructor(props){
        super(props);
        let {enhancement, convertSimpleCode} = props;
        let simpleCode = this.getEnhancementSimpleCode(props);
        let expertVar = this.getVariablesForExpertMode(true);
        let expertCode = enhancement ? enhancement.expertCode : '';
        let onlyExpert = convertSimpleCode(simpleCode) !== expertCode && expertCode !== '';
        this.state = {
            onlyExpert,
            mode: 'expert',
            constants: [
                {name: 'constant1', value: 'editing'},
                {name: 'constant2', value: 3.14},
            ],
            operators: [
                {name: 'add', value: '+'},
                {name: 'subtract', value: '-'},
                {name: 'multiplication', value: '*'},
                {name: 'division', value: '/'},
            ],
            expertVar,
            expertCode,
            simpleCode,
            name: enhancement ? enhancement.name : '',
            description: enhancement ? enhancement.description : '',
        };
    }

    componentDidMount(){
        setFocusById('enhancement_name');
    }

    /**
     * to get simple code
     */
    getEnhancementSimpleCode(props){
        let resultVariable = this.getResultVariable(props);
        const {enhancement} = props;
        let result = enhancement ? enhancement.simpleCode : null;
        if(!result || !result.hasOwnProperty('pointer') || !result.hasOwnProperty('code') || result.code === null){
            result = {pointer: resultVariable.name !== '' ? 1 : 0, code: [resultVariable]};
        }
        return result;
    }

    /**
     * to add constant
     */
    addConstant(constant){
        let {constants} = this.state;
        constants.push(constant);
        this.setState({constants});
    }

    /**
     * to remove constant
     */
    removeConstant(constant){
        let {constants} = this.state;
        constants = constants.filter(c => c.name !== constant.name);
        this.setState({constants});
    }

    /**
     * to update name of enhancement
     */
    updateName(name){
        let {enhancement, setEnhancement} = this.props;
        enhancement.name = name;
        setEnhancement(enhancement);
        this.setState({name});
    }

    /**
     * to update description of enhancement
     */
    updateDescription(description){
        let {enhancement, setEnhancement} = this.props;
        enhancement.description = description;
        setEnhancement(enhancement);
        this.setState({description});
    }

    /**
     * to update expert code
     */
    updateExpertCode(code){
        let {onlyExpert, simpleCode} = this.state;
        const {setEnhancement, convertSimpleCode} = this.props;
        let {enhancement} = this.props;
        let tmpSimpleCode = convertSimpleCode(simpleCode);
        if(simpleCode.code.length === 1){
            tmpSimpleCode = this.getVariablesForExpertMode() + tmpSimpleCode;
        }
        if(code !== tmpSimpleCode) {
            if (!onlyExpert) {
                onlyExpert = true;
            }
        } else{
            onlyExpert = false;
        }
        enhancement.expertCode = code;
        setEnhancement(enhancement);
        this.setState({expertCode: code, onlyExpert});
    }

    /**
     * to update pointer for simple code
     */
    updateSimpleCodePointer(pointer){
        if(pointer >= 0) {
            let {simpleCode} = this.state;
            simpleCode.pointer = pointer + 1;
            this.setState({simpleCode});
        }
    }

    /**
     * to change mode of enhancement
     */
    onChangeMode(e){
        this.setState({
            mode: e.target.value,
        });
    }

    /**
     * to add variable in code
     */
    addVariableInCode(variable){
        let {simpleCode} = this.state;
        const {setEnhancement, convertSimpleCode} = this.props;
        let {enhancement} = this.props;
        let {pointer, code} = simpleCode;
        if(pointer >= 0) {
            code.splice(pointer, 0, {...variable, type: 'variable'});
        }
        simpleCode.pointer = simpleCode.pointer + 1;
        simpleCode.code = code;
        enhancement.simpleCode = simpleCode;
        let expertCode = convertSimpleCode(simpleCode);
        enhancement.expertCode = expertCode;
        setEnhancement(enhancement);
        this.setState({simpleCode, expertCode});
    }

    /**
     * to add constant in code
     */
    addConstantInCode(constant){
        let {simpleCode} = this.state;
        const {setEnhancement, convertSimpleCode} = this.props;
        let {enhancement} = this.props;
        let {pointer, code} = simpleCode;
        if(pointer >= 0) {
            code.splice(pointer, 0, {...constant, type: 'constant'});
        }
        simpleCode.pointer = simpleCode.pointer + 1;
        simpleCode.code = code;
        enhancement.simpleCode = simpleCode;
        let expertCode = convertSimpleCode(simpleCode);
        enhancement.expertCode = expertCode;
        setEnhancement(enhancement);
        this.setState({simpleCode, expertCode});
    }

    /**
     * to add operator in code
     */
    addOperatorInCode(operator){
        let {simpleCode} = this.state;
        const {setEnhancement, convertSimpleCode} = this.props;
        let {enhancement} = this.props;
        let {pointer, code} = simpleCode;
        if(pointer >= 0) {
            code.splice(pointer, 0, {...operator, type: 'operator'});
        }
        simpleCode.pointer = simpleCode.pointer + 1;
        simpleCode.code = code;
        enhancement.simpleCode = simpleCode;
        let expertCode = convertSimpleCode(simpleCode);
        enhancement.expertCode = expertCode;
        setEnhancement(enhancement);
        this.setState({simpleCode, expertCode});
    }

    /**
     * to remove code piece from simple code
     */
    removeCodePiece(index){
        let {simpleCode} = this.state;
        const {setEnhancement, convertSimpleCode} = this.props;
        let {enhancement} = this.props;
        let {code} = simpleCode;

        if(index >= 0) {
            code.splice(index, 1);
            simpleCode.pointer = index;
        }
        simpleCode.code = code;
        enhancement.simpleCode = simpleCode;
        let expertCode = convertSimpleCode(simpleCode);
        enhancement.expertCode = expertCode;
        setEnhancement(enhancement);
        this.setState({simpleCode, expertCode});
    }

    /**
     * to get variables
     */
    getVariables(props){
        const {binding} = props;
        let variables = [];
        let fromFieldName = '';
        let fromFieldType = '';
        let fromFieldColor = '';
        if(binding.length > 0) {
            for (let i = 0; i < binding.length; i++) {
                fromFieldName = binding[i].from.field;
                fromFieldType = binding[i].from.type;
                fromFieldColor = binding[i].from.color;
                if (fromFieldName !== '') {
                    variables.push({name: fromFieldName, value: null, type: fromFieldType, color: fromFieldColor});
                }
            }
        }
        return variables;
    }

    /**
     * to get variables for result
     */
    getResultVariable(props){
        const {binding} = props;
        let variables = this.getVariables(props);
        let result = {name: '', value: null, type: 'variable'};
        if(binding.length > 0) {
            let toFieldName = binding[0].to.field;
            let toFieldType = binding[0].to.type;
            let toFieldColor = binding[0].to.color;
            if (toFieldName !== '') {
                result = {name: toFieldName, value: null, type: toFieldType, color: toFieldColor};
            }
        }
        if(variables.findIndex(v => v.name === result.name) !== -1){
            result.name = `_to_connector_${result.name}`;
        }
        return result;
    }

    /**
     * to get variables for expert mode
     */
    getVariablesForExpertMode(withComments = false){
        let {enhancement, setEnhancement} = this.props;
        let resultVariable = this.getResultVariable(this.props);
        let variables = this.getVariables(this.props);
        let result = withComments ? "//" : '';
        result += `var RESULT_VAR = ${resultVariable.color}.(${resultVariable.type}).${resultVariable.name};
`;
        for(let i = 0; i < variables.length; i ++){
            if(withComments) result += "//";
            result += `var VAR_${i} = ${variables[i].color}.(${variables[i].type}).${variables[i].name};`;
            result += i < variables.length - 1 ? `
` : '';
        }
        if(withComments){
            enhancement.expertVar = result;
            setEnhancement(enhancement);
        }
        return result;
    }

    renderEnhancement(){
        const {mode, constants, operators, onlyExpert, expertVar} = this.state;
        let {readOnly} = this.props;
        let {simpleCode, expertCode} = this.state;
        let variables = this.getVariables(this.props);
        switch(mode) {
            case 'simple':
                if(onlyExpert){
                    readOnly = true;
                }
                return (
                    <div>
                        <Row>
                            <Col md={6}>
                                <Variables
                                    variables={variables}
                                    addVariableInCode={::this.addVariableInCode}
                                    readOnly={readOnly}
                                />
                            </Col>
                            <Col md={6}>
                                <Constants
                                    addConstant={::this.addConstant}
                                    removeConstant={::this.removeConstant}
                                    constants={constants}
                                    variables={variables}
                                    addConstantInCode={::this.addConstantInCode}
                                    readOnly={readOnly}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Operators
                                    operators={operators}
                                    addOperatorInCode={::this.addOperatorInCode}
                                    readOnly={readOnly}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Editor
                                    updateCodePointer={::this.updateSimpleCodePointer}
                                    code={simpleCode}
                                    resultVariable={::this.getResultVariable(this.props)}
                                    removeCodePiece={::this.removeCodePiece}
                                    readOnly={readOnly}
                                />
                            </Col>
                        </Row>
                    </div>
                );
            case 'expert':
                return(
                    <div>
                        <AceEditor
                            mode="javascript"
                            theme="tomorrow"
                            onChange={::this.updateExpertCode}
                            name="enhancement_var"
                            editorProps={{$blockScrolling: true, $useWorker: false}}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={false}
                            value={expertVar}
                            height={'50px'}
                            width={'100%'}
                            readOnly={true}
                            setOptions={{
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: false,
                                enableSnippets: false,
                                showLineNumbers: false,
                                tabSize: 2,
                            }}
                        />
                        <AceEditor
                            mode="javascript"
                            theme="tomorrow"
                            onChange={::this.updateExpertCode}
                            name="enhancement_code"
                            editorProps={{$blockScrolling: true}}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={`${expertCode}`}
                            height={'260px'}
                            width={'100%'}
                            readOnly={readOnly}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: false,
                                tabSize: 2,
                            }}
                        />
                    </div>
                );
        }
        return null;
    }

    renderMode(){
        const {mode, onlyExpert} = this.state;
        return(
            <div className={styles.mode}>
                <span>simple <input disabled={onlyExpert} type={'radio'} name={'mode'} value={'simple'} checked={mode === 'simple'} onChange={::this.onChangeMode}/></span>
                <span>expert <input type={'radio'} name={'mode'} value={'expert'} checked={mode === 'expert'} onChange={::this.onChangeMode}/></span>
            </div>
        );
    }


    render(){
        const {name, description} = this.state;
        let {readOnly} = this.props;
        return (
            <div>{/*
                <Row>
                    <Col md={12}>
                        {this.renderMode()}
                    </Col>
                </Row>*/}
                <Row>
                    <Col md={12}>
                        <Input
                            onChange={::this.updateName}
                            id={'enhancement_name'}
                            name={'Name'}
                            label={'Name'}
                            type={'text'}
                            icon={'perm_identity'}
                            maxLength={128}
                            value={name}
                            rows={4}
                            readOnly={readOnly}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <Input
                            onChange={::this.updateDescription}
                            id={'enhancement_description'}
                            name={'Description'}
                            label={'Description'}
                            type={'text'}
                            icon={'perm_identity'}
                            value={description}
                            multiline={true}
                            rows={4}
                            readOnly={readOnly}
                        />
                    </Col>
                </Row>
                {this.renderEnhancement()}
            </div>
        );
    }
}

Enhancement.propTypes = {
    binding: PropTypes.array.isRequired,
    setEnhancement: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    convertSimpleCode: PropTypes.func.isRequired,
    enhancement: PropTypes.instanceOf(CEnhancement),
};

export default Enhancement;