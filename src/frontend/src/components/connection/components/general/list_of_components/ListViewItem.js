import React from 'react';
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {isString} from "@utils/app";
import Confirmation from "@components/general/app/Confirmation";
import {withTranslation} from "react-i18next";
import Checkbox from "@basic_components/inputs/Checkbox";
import styles from "@themes/default/general/list_of_components.scss";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}

@connect(mapStateToProps, {})
@withTranslation('app')
class ListViewItem extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            showConfirm: false,
            showActions: false,
        }
    }

    /**
     * to set showConfirm state
     */
    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to show actions
     */
    showActions(){
        if(this.props.actionsShouldBeMinimized) {
            this.setState({showActions: true});
        }
    }

    /**
     * to hide actions
     */
    hideActions(){
        if(this.props.actionsShouldBeMinimized){
            this.setState({showActions: false});
        }
    }

    getObjectDataFromItem(){
        const {item} = this.props;
        let data = {};
        for(let i = 0; i < item.length; i++){
            data[item[i].name] = item[i].value;
        }
        return data;
    }

    getLinks(){
        const {mapEntity} = this.props;
        let data = this.getObjectDataFromItem();
        let viewLink = mapEntity.hasOwnProperty('getViewLink') ? mapEntity.getViewLink(data) : '';
        let updateLink = mapEntity.hasOwnProperty('getUpdateLink') ? mapEntity.getUpdateLink(data) : '';
        return {viewLink, updateLink};
    }

    /**
     * to view item
     */
    view(){
        const {router} = this.props;
        const viewLink = this.getLinks().viewLink;
        if(viewLink) router.push(viewLink);
    }

    /**
     * to update item
     */
    update(){
        const {router} = this.props;
        const updateLink = this.getLinks().updateLink;
        if(updateLink) router.push(updateLink);
    }

    /**
     * to delete item
     */
    doDelete(){
        const {mapEntity, deleteCheck, index} = this.props;
        let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
        let data = this.getObjectDataFromItem();
        if(onDelete) {
            deleteCheck({
                key: index,
                id: data.id
            });
            onDelete(data);
        }
        this.toggleConfirm();
    }

    /**
     * to show confirmation before delete
     */
    wantDelete(){
        this.toggleConfirm();
    }

    checkOneEntity(...args){
        this.props.checkOneEntity(...args, this.props.setChecks);
    }

    isEntityCannotBeDeleted(){
        const {authUser, item} = this.props;
        let findItem = item.find(elem => elem.name === 'email');
        if(findItem){
            if(authUser.sub === findItem.value){
                return true;
            }
        } else{
            findItem = item.find(elem => elem.name === 'name');
            if(findItem){
                if(authUser.role === findItem.value){
                    return true;
                }
            }
        }
        return false;
    }

    render(){
        const {showConfirm, showActions} = this.state;
        const {t, item, isItemActionsBefore, mapEntity, checks, index, renderAdditionalActions, allEntities, entityIdName, readOnly, actionsShouldBeMinimized, deletingEntity} = this.props;
        const {viewLink, updateLink} = this.getLinks();
        let data = this.getObjectDataFromItem();
        let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
        let hasView = isString(viewLink) && viewLink !== '';
        let hasUpdate = isString(updateLink) && updateLink !== '';
        let hasDelete = onDelete !== null && !this.isEntityCannotBeDeleted();
        let checked = checks.findIndex(c => c.id === data.id && c.value) !== -1;
        const entity = allEntities.find(entity => entity[entityIdName] === item[0].value);
        const isCheckboxesVisible = !readOnly;
        const isActionsVisible = !readOnly;
        let areActionsMinimized = showActions || !actionsShouldBeMinimized;
        return(
            <tr>
                {isCheckboxesVisible &&
                    <td>
                        <Checkbox
                            id={`input_check_${index}`}
                            checked={checked}
                            onChange={(e) => this.checkOneEntity(e, {key: index, id: data.id})}
                            labelClassName={styles.checkbox_label}
                            inputClassName={styles.checkbox_field}
                        />
                    </td>
                }
                {item.map((element) => {
                    if(element.name === 'id' || element.visible === false) return null;
                    let shortText = isString(element.value) && element.value.length > 128 ? `${element.value.substr(0, 128)}...` : element.value;
                    let fullText = isString(element.value) ? element.value : '';
                    if(React.isValidElement(shortText)){
                        return shortText;
                    }
                    let style = element.hasOwnProperty('style') ? element.style : null;
                    return (
                        <td key={element.name} title={fullText} style={style}>
                            {shortText}
                        </td>
                    );
                })}
                {isActionsVisible &&
                    <td className={styles.list_view_actions}>
                        {!areActionsMinimized ?
                            <div className={styles.actions}>
                                <div>
                                    <TooltipFontIcon tooltip={'More'} value={'more_horiz'} isButton turquoiseTheme
                                                     onClick={() => this.showActions()}/>
                                </div>
                            </div>
                        :
                            <div className={actionsShouldBeMinimized ? `${styles.maximized_actions}` : `${styles.actions}`} onMouseLeave={() => this.hideActions()}>
                                <div>
                                    {isItemActionsBefore && typeof renderAdditionalActions === 'function' && renderAdditionalActions(entity)}
                                    {hasView &&
                                    <TooltipFontIcon tooltip={'View'} value={'visibility'} onClick={() => this.view()}
                                                     isButton={true}
                                                     turquoiseTheme/>}
                                    {hasUpdate &&
                                    <TooltipFontIcon tooltip={'Edit'} value={'edit'} onClick={() => this.update()}
                                                     isButton={true}
                                                     turquoiseTheme/>}
                                    {hasDelete &&
                                    <TooltipFontIcon tooltip={'Delete'} value={typeof deletingEntity === 'function' && deletingEntity(data) ? 'loading' : 'delete'} onClick={() => this.wantDelete()}
                                                     isButton={true} turquoiseTheme/>}
                                    {!isItemActionsBefore && typeof renderAdditionalActions === 'function' && renderAdditionalActions(entity)}
                                </div>
                            </div>
                        }
                        <Confirmation
                            okClick={() => this.doDelete()}
                            cancelClick={() => this.toggleConfirm()}
                            active={showConfirm}
                            title={t('LIST.CARD.CONFIRMATION_TITLE')}
                            message={t('LIST.CARD.CONFIRMATION_MESSAGE')}
                        />
                    </td>
                }
            </tr>
        );
    }
}


ListViewItem.propTypes = {
    readOnly: PropTypes.bool,
    actionsShouldBeMinimized: PropTypes.bool,
}

ListViewItem.defaultProps = {
    readOnly: false,
    actionsShouldBeMinimized: false,
}

export default ListViewItem;