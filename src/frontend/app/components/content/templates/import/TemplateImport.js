/*
 * Copyright (C) <2019>  <becon GmbH>
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
import Dialog from "react-toolbox/lib/dialog";
import ContentNavigationButton from "../../../general/content/ContentNavigationButton";
import FontIcon from "../../../general/basic_components/FontIcon";
import BrowseButton from "../../../general/basic_components/buttons/BrowseButton";
import {TemplatePermissions} from "../../../../utils/constants/permissions";
import {importTemplate} from "../../../../actions/templates/add";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../themes/default/content/templates/list.scss';


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
    }

    render(){
        const {browseTitle} = this.state;
        const {authUser} = this.props;
        let {showDialog} = this.state;
        return (
            <div>
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
                    onEscKeyDown={::this.toggleImport}
                    onOverlayClick={::this.toggleImport}
                    title={'Import Template'}
                >
                    <div className={`${theme.input} ${theme.withIcon}`}>
                        <div className={`${theme.inputElement} ${theme.filled} ${styles.input_file_label}`}>{browseTitle}</div>
                        <BrowseButton
                            icon="file_upload"
                            label="Upload"
                            onChange={::this.onChangeImportTemplateFile}
                            accept=".json"
                            className={`${styles.input_file_browse}`}
                        />
                        <FontIcon value={'attach_file'} className={theme.icon}/>
                        <span className={theme.bar}/>
                        <label className={theme.label}>{'JSON'}</label>
                    </div>
                </Dialog>
            </div>
        );
    }
}

export default TemplateImport;