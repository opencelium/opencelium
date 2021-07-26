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
import {connect} from 'react-redux';
import Dialog from "@basic_components/Dialog";
import ContentNavigationButton from "../../../general/content/ContentNavigationButton";
import BrowseButton from "@basic_components/buttons/BrowseButton";
import {TemplatePermissions} from "@utils/constants/permissions";
import {importTemplate} from "@actions/templates/add";

import styles from '@themes/default/content/templates/list.scss';
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CTemplateVoiceControl from "@classes/voice_control/CTemplateVoiceControl";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

/**
 * Layout for Applications
 */
@connect(mapStateToProps, {importTemplate})
class TemplateImport extends Component{

    constructor(props){
        super(props);

        this.state = {
            showDialog: false,
            browseTitle: 'Please, select a json file...',
            templateFile: null,
        };
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CTemplateVoiceControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CTemplateVoiceControl);
    }

    toggleImport(){
        this.setState({showDialog: !this.state.showDialog});
    }

    onChangeImportTemplateFile(e){
        const f = e.target.files[0];
        if(f) {
            this.setState({browseTitle: f.name, templateFile: f});
        } else{
            this.setState({browseTitle: 'Please, select a json file...', templateFile: null});
        }
    }

    import(){
        this.props.importTemplate({template: this.state.templateFile});
        this.setState({
            showDialog: false,
            browseTitle: 'Please, select a json file...',
            templateFile: null,
        });
    }

    render(){
        const {browseTitle} = this.state;
        const {authUser} = this.props;
        let {showDialog} = this.state;
        return (
            <div style={{marginTop: '20px'}}>
                <ContentNavigationButton
                    authUser={authUser}
                    title={'Import'}
                    permission={TemplatePermissions.CREATE}
                    link={''}
                    icon={'add'}
                    type={'add'}
                    onClick={::this.toggleImport}
                />
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.import}, {label: 'Cancel', onClick: ::this.toggleImport}]}
                    active={showDialog}
                    toggle={::this.toggleImport}
                    title={'Import Template'}
                >
                    <BrowseButton
                        label={'JSON'}
                        icon={'attach_file'}
                        browseTitle={browseTitle}
                        browseProps={{
                            icon: "file_upload",
                            label: "Upload",
                            onChange: ::this.onChangeImportTemplateFile,
                            accept: ".json",
                            className: styles.input_file_browse,
                        }}
                    />
                </Dialog>
            </div>
        );
    }
}

export default TemplateImport;