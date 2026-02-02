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

import React from "react";
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withTranslation} from "react-i18next";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import {OFFLINE_UPDATE} from "@entity/update_assistant/components/available_updates/AvailableUpdates";
import {deleteApplicationFile as deleteVersion} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import {DefaultTextSize} from "@entity/application/utils/constants";
import Button from "@app_component/base/button/Button";

function mapStateToProps(state){
    const application = state.applicationReducer;
    const updateAssistant = state.updateAssistantReducer;
    return{
        currentVersion: application.version,
        deletingVersion: updateAssistant.deletingApplicationFile,
    };
}

@connect(mapStateToProps, {deleteVersion})
@withTranslation('update_assistant')
class OldVersionEntry extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMouseOver: false,
            showConfirmDelete: false,
        }
    }

    toggleConfirmDelete(){
        this.setState({
            showConfirmDelete: !this.state.showConfirmDelete,
        });
    }

    onMouseOver(){
        this.setState({
            isMouseOver: true,
        });
    }

    onMouseLeave(){
        this.setState({
            isMouseOver: false
        });
    }

    deleteOldVersion(){
        const {version, deleteVersion} = this.props;
        deleteVersion(version);
        this.toggleConfirmDelete();
    }

    renderConfirmation(){
        const {showConfirmDelete} = this.state;
        const {t} = this.props;
        return(
            <Confirmation
                okClick={(a) => this.deleteOldVersion(a)}
                cancelClick={(a) => this.toggleConfirmDelete(a)}
                active={showConfirmDelete}
                title={t('FORM.DELETE_CONFIRMATION_TITLE')}
                message={t('FORM.DELETE_CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {isMouseOver} = this.state;
        const {t, version, deletingVersion, currentVersion, activeMode, onChangelogClick} = this.props;
        const isVisibleDeleteIcon = isMouseOver && activeMode === OFFLINE_UPDATE;
        let icon = 'delete';
        if(currentVersion && currentVersion.name === version.name && deletingVersion === API_REQUEST_STATE.START){
            icon = 'loading';
        }
        return(
            <tr className={styles.disable_version_entry} onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)}>
                <td style={{fontSize: `${DefaultTextSize}px`}} onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)}>{`v${version.name}`}</td>
                <td style={{fontSize: `${DefaultTextSize}px`}} onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)}>
                    {version.changelogLink ?
                        <span onClick={onChangelogClick} style={{
                            cursor: 'pointer',
                            color: '#000',
                            textDecoration: 'underline'
                        }}>{t('FORM.CHANGELOG')}</span>
                        :
                        <span style={{}}>{t('FORM.CHANGELOG')}</span>
                    }
                </td>
                <td onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)}
                    style={{position: 'relative', fontSize: `${DefaultTextSize}px`}}>
                    <span>{t('FORM.OLD_VERSION')}</span>
                    {isVisibleDeleteIcon &&
                        <Button
                            className={styles.delete_icon}
                            handleClick={(a) => this.toggleConfirmDelete(a)}
                            hasBackground={false}
                            icon={icon}
                        />
                    }
                    {this.renderConfirmation()}
                </td>
            </tr>
        );
    }
}

OldVersionEntry.propTypes = {
    version: PropTypes.object.isRequired,
    activeMode: PropTypes.string.isRequired,
}

export default OldVersionEntry;
