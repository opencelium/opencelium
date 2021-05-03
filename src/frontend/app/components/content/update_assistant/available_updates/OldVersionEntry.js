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

import React from "react";
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withTranslation} from "react-i18next";
import styles from "@themes/default/content/update_assistant/main";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {deleteVersion} from "@actions/update_assistant/delete";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Confirmation from "@components/general/app/Confirmation";
import {OFFLINE_UPDATE} from "@components/content/update_assistant/available_updates/AvailableUpdates";

function mapStateToProps(state){
    const updateAssistant = state.get('update_assistant');
    return{
        currentVersion: updateAssistant.get('currentVersion'),
        deletingVersion: updateAssistant.get('deletingVersion'),
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
        ::this.toggleConfirmDelete();
    }

    renderConfirmation(){
        const {showConfirmDelete} = this.state;
        const {t} = this.props;
        return(
            <Confirmation
                okClick={::this.deleteOldVersion}
                cancelClick={::this.toggleConfirmDelete}
                active={showConfirmDelete}
                title={t('FORM.DELETE_CONFIRMATION_TITLE')}
                message={t('FORM.DELETE_CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {isMouseOver} = this.state;
        const {t, version, deletingVersion, currentVersion, activeMode} = this.props;
        const isVisibleDeleteIcon = isMouseOver && activeMode === OFFLINE_UPDATE;
        let icon = 'delete';
        if(currentVersion && currentVersion.name === version.name && deletingVersion === API_REQUEST_STATE.START){
            icon = 'loading';
        }
        return(
            <tr className={styles.disable_version_entry} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave}>
                <td onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave}>{version.name}</td>
                <td onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave}><a href={version.changelogLink} target={'_blank'}>{t('FORM.CHANGELOG')}</a></td>
                <td onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave} style={{position: 'relative'}}>
                    <span>{t('FORM.OLD_VERSION')}</span>
                    {isVisibleDeleteIcon &&
                        <TooltipFontIcon
                            className={styles.delete_icon}
                            isButton={true}
                            value={icon}
                            tooltip={t('FORM.DELETE_TOOLTIP')}
                            onClick={::this.toggleConfirmDelete}
                            size={20}
                        />
                    }
                    {::this.renderConfirmation()}
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