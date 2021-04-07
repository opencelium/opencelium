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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';
import 'brace/theme/tomorrow';

import {Row, Col} from "react-grid-system";

import Input from '@basic_components/inputs/Input';
import CEnhancement from "@classes/components/content/connection/field_binding/CEnhancement";
import {setFocusById} from "@utils/app";


/**
 * Enhancement Component
 */
class Enhancement extends Component{

    constructor(props){
        super(props);
        let {enhancement} = props;
        let expertVar = enhancement ? enhancement.expertVar : '';
        let expertCode = enhancement ? enhancement.expertCode : '';
        this.state = {
            expertVar,
            expertCode,
            name: enhancement ? enhancement.name : '',
            description: enhancement ? enhancement.description : '',
        };
    }

    componentDidMount(){
        setFocusById('enhancement_description');
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
        const {setEnhancement} = this.props;
        let {enhancement} = this.props;
        enhancement.expertCode = code;
        setEnhancement(enhancement);
        this.setState({expertCode: code});
    }

    renderEnhancement(){
        const {expertVar} = this.state;
        let {readOnly} = this.props;
        let {expertCode} = this.state;
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

    render(){
        const {description} = this.state;
        let {readOnly} = this.props;
        return (
            <div>
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
                            rows={6}
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
    setEnhancement: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    enhancement: PropTypes.instanceOf(CEnhancement),
};

Enhancement.defaultProps = {
};

export default Enhancement;