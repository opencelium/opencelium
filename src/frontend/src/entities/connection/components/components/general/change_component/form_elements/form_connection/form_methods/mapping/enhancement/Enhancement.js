/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ChangeEvent, Component} from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import "ace-builds/src-noconflict/snippets/javascript";
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-tomorrow';

import {Row, Col} from "react-grid-system";

import Input from "@app_component/base/input/Input";
import {getMarker, setFocusById} from "@application/utils/utils";
import CEnhancement from "@classes/content/connection/field_binding/CEnhancement";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {getReactXmlStyles} from "@app_component/base/input/xml_view/styles";


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
            markers: [],
        };
    }

    componentDidMount(){
        setFocusById('enhancement_description');
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {enhancementRef} = this.props;
        if(prevProps.enhancement && (prevProps.enhancement.expertVar !== this.props.enhancement.expertVar || prevProps.enhancement.expertCode !== this.props.enhancement.expertCode
        || prevProps.enhancement.name !== this.props.enhancement.name || prevProps.enhancement.description !== this.props.enhancement.description)){
            this.setState({
                expertVar: this.props.enhancement.expertVar,
                expertCode: this.props.enhancement.expertCode,
                name: this.props.enhancement.name,
                description: this.props.enhancement.description,
            })
        }
        if(this.state.expertCode !== prevState.expertCode){
            const newMarkers = getMarker(enhancementRef.current.editor, this.state.expertCode, CEnhancement.generateNotExistVar());
            this.setState({markers: newMarkers});
        }
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
        const {expertVar, markers} = this.state;
        let {readOnly} = this.props;
        let {expertCode} = this.state;
        const styleProps = {
            marginTop: '25px',
            display: 'inline-block',
            width: 'calc(100% - 50px)',
            marginLeft: '46px',
            marginBottom: 0,
            height: 'calc(100% - 37px)',
            borderBottom: '1px solid #e9e9e9'
        }
        return(
            <Input readOnly={readOnly} value={'script'} label={'Script'} icon={'javascript'} marginBottom={'20px'} display={'grid'}>
                <AceEditor
                    style={{...getReactXmlStyles(styleProps), marginLeft: '50px', marginBottom: 0, width: styleProps.width}}
                    mode="javascript"
                    theme="tomorrow"
                    onChange={(a) => this.updateExpertCode(a)}
                    name="enhancement_var"
                    editorProps={{$blockScrolling: true}}
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
                        useWorker: false,
                    }}
                />
                <AceEditor
                    ref={this.props.enhancementRef}
                    style={{...getReactXmlStyles({...styleProps, marginTop: '0'}), marginLeft: '50px', marginBottom: 0, width: styleProps.width, height: '190px'}}
                    markers={markers}
                    mode="javascript"
                    theme="tomorrow"
                    onChange={(a) => this.updateExpertCode(a)}
                    name="enhancement_code"
                    editorProps={{$blockScrolling: true}}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={`${expertCode}`}
                    height={'330px'}
                    width={'100%'}
                    readOnly={readOnly}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: false,
                        tabSize: 2,
                        useWorker: false,
                    }}
                />
            </Input>
        );
    }

    render(){
        const {description} = this.state;
        let {readOnly} = this.props;
        return (
            <div>
                <Row>
                    <Col md={12}>
                        <InputTextarea
                            id={'enhancement_description'}
                            readOnly={readOnly}
                            icon={'notes'}
                            onChange={(e) => this.updateDescription(e.target.value)}
                            name={'Description'}
                            label={'Description'}
                            value={description}
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
    enhancement: PropTypes.any,
};

Enhancement.defaultProps = {
};

export default React.forwardRef((props, ref) => <Enhancement enhancementRef={ref} {...props}/>);
