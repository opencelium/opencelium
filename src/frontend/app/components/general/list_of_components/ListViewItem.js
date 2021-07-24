import React from 'react';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {isString} from "@utils/app";
import Confirmation from "@components/general/app/Confirmation";
import {withTranslation} from "react-i18next";

@withTranslation('app')
class ListViewItem extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            showConfirm: false,
        }
    }

    /**
     * to set showConfirm state
     */
    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
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
        const {mapEntity} = this.props;
        let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
        let data = this.getObjectDataFromItem();
        if(onDelete) {
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

    render(){
        const {showConfirm} = this.state;
        const {t, item, mapEntity} = this.props;
        const {viewLink, updateLink} = this.getLinks();
        let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
        let hasView = isString(viewLink) && viewLink !== '';
        let hasUpdate = isString(updateLink) && updateLink !== '';
        let hasDelete = onDelete !== null;
        return(
            <tr>
                {item.map((element) => {
                    if(element.name === 'id') return null;
                    let shortText = isString(element.value) && element.value.length > 128 ? `${element.value.substr(0, 128)}...` : element.value;
                    let fullText = isString(element.value) ? element.value : '';
                    return (
                        <td key={element.name} title={fullText}>
                            {shortText}
                        </td>
                    );})}
                <td>
                    {hasView && <TooltipFontIcon tooltip={'View'} value={'visibility'} onClick={::this.view} isButton={true} turquoiseTheme/>}
                    {hasUpdate && <TooltipFontIcon tooltip={'Edit'} value={'edit'} onClick={::this.update} isButton={true} turquoiseTheme/>}
                    {hasDelete && <TooltipFontIcon tooltip={'Delete'} value={'delete'} onClick={::this.wantDelete} isButton={true} turquoiseTheme/>}
                    <Confirmation
                        okClick={::this.doDelete}
                        cancelClick={::this.toggleConfirm}
                        active={showConfirm}
                        title={t('LIST.CARD.CONFIRMATION_TITLE')}
                        message={t('LIST.CARD.CONFIRMATION_MESSAGE')}
                    />
                </td>
            </tr>
        );
    }
}

export default ListViewItem;