import React from "react";
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/available_updates/main";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {deleteVersion} from "@actions/update_assistant/delete";
import {API_REQUEST_STATE} from "@utils/constants/app";

function mapStateToProps(state){
    const updateAssistant = state.get('update_assistant');
    return{
        currentVersion: updateAssistant.get('currentVersion'),
        deletingVersion: updateAssistant.get('deletingVersion'),
    };
}

@connect(mapStateToProps, {deleteVersion})
class OldVersionEntry extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            showDeleteIcon: false,
        }
    }

    showDeleteIcon(){
        this.setState({
            showDeleteIcon: true,
        });
    }

    hideDeleteIcon(){
        this.setState({
            showDeleteIcon: false
        });
    }

    deleteOldVersion(){
        const {version, deleteVersion} = this.props;
        deleteVersion(version);
    }

    render(){
        const {showDeleteIcon} = this.state;
        const {version, deletingVersion, currentVersion} = this.props;
        let icon = 'delete';
        if(currentVersion && currentVersion.id === version.id && deletingVersion === API_REQUEST_STATE.START){
            icon = 'loading';
        }
        return(
            <tr key={version.name} className={styles.disable_version_entry} onMouseOver={::this.showDeleteIcon} onMouseLeave={::this.hideDeleteIcon}>
                <td onMouseOver={::this.showDeleteIcon} onMouseLeave={::this.hideDeleteIcon}>{version.name}</td>
                <td onMouseOver={::this.showDeleteIcon} onMouseLeave={::this.hideDeleteIcon}><a href={'#'}>Changelog</a></td>
                <td onMouseOver={::this.showDeleteIcon} onMouseLeave={::this.hideDeleteIcon} style={{position: 'relative'}}>
                    <span>old</span>
                    {showDeleteIcon &&
                        <TooltipFontIcon
                            className={styles.delete_icon}
                            isButton={true}
                            value={icon}
                            tooltip={'Delete'}
                            onClick={::this.deleteOldVersion}
                            size={20}
                        />
                    }
                </td>
            </tr>
        );
    }
}

OldVersionEntry.propTypes = {
    version: PropTypes.object.isRequired,
}

export default OldVersionEntry;