import React from 'react';
import PropTypes from 'prop-types';
import Property from "@basic_components/xml_editor/Property";
import styles from '@themes/default/general/basic_components.scss';
import CTag, {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/CTag";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CProperty from "@classes/components/general/basic_components/CProperty";
import ChangeProperty from "@basic_components/xml_editor/ChangeProperty";
import ChangeTag from "@basic_components/xml_editor/ChangeTag";

const XML_TAG_INDENT = 15;


class Tag extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasMinimizerIcon: false,
            property: CProperty.createProperty(),
            hasAddPropertyPopup: false,
            hasUpdateTagPopup: false,
            hasAddTagPopup: false,
            hasAddTagIcon: false,
            addTag: CTag.createTag(),
        };
    }

    showAddTagIcon(){
        this.setState({
            hasAddTagIcon: true,
        });
    }

    hideAddTagIcon(){
        this.setState({
            hasAddTagIcon: false,
        });
    }

    showAddTagPopup(){
        this.setState({
            hasAddTagPopup: true,
        });
    }

    hideAddTagPopup(){
        this.setState({
            hasAddTagPopup: false,
        });
    }

    showUpdateTagPopup(){
        this.setState({
            hasUpdateTagPopup: true,
        });
    }

    hideUpdateTagPopup(){
        this.setState({
            hasUpdateTagPopup: false,
        });
    }

    showAddPropertyPopup(){
        this.setState({
            hasAddPropertyPopup: true,
        });
    }

    hideAddPropertyPopup(){
        this.setState({
            hasAddPropertyPopup: false,
            property: CProperty.createProperty(),
        });
    }

    showMinimizerIcon(){
        this.setState({
            hasMinimizerIcon: true,
        });
    }

    hideMinimizerIcon(){
        this.setState({
            hasMinimizerIcon: false,
        });
    }

    showTagIcons(){
        this.setState({
            hasDeleteTagIcon: true,
            hasAddPropertyIcon: true,
            hasAddTagIcon: true,
        });
    }

    hideTagIcons(){
        this.setState({
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasAddTagIcon: false,
        });
    }

    deleteTag(e, index){
        const {tag, update} = this.props;
        tag.removeTag(index);
        update();
    }

    toggleTag(){
        const {tag, update} = this.props;
        tag.minimized = !tag.minimized;
        update();
    }

    addProperty(property){
        const {tag, update} = this.props;
        if(!tag.addProperty(property)){
            alert('Property name should be unique');
        }
        update();
    }

    renderProperties(){
        const {tag, update} = this.props;
        return tag.properties.map(property => {
            return(
                <Property key={`${property.name}`} tag={tag} property={property} update={update}/>
            );
        })
    }

    renderSubTags(){
        const {tag, update, } = this.props;
        if(tag.minimized){
            return <TooltipFontIcon className={styles.expand_tag} tooltip={'more'} value={'more_horiz'} onClick={::this.toggleTag}/>;
        }
        if(isString(tag.tags)){
            return <span>{tag.tags}</span>;
        }
        if(tag.tags.length === 0){
            return <div><TooltipFontIcon className={styles.add_tag_icon_outside} tooltip={'Add Item'} value={'add_circle_outline'} onClick={::this.showAddTagPopup}/></div>;
        }
        return tag.tags ? tag.tags.map((t, index) => {
            return <Tag key={`${t.name}_${index}`} tag={t} update={update} deleteTag={(e) => ::this.deleteTag(e, index)}/>;
        }) : null;
    }

    render() {
        const {hasAddPropertyIcon, hasDeleteTagIcon, hasMinimizerIcon, hasAddPropertyPopup, property, hasUpdateTagPopup, hasAddTagPopup, addTag, hasAddTagIcon} = this.state;
        const {tag, isDeclaration, deleteTag, update} = this.props;
        const hasMinimizer = !isString(tag.tags) && tag.tags !== null && hasMinimizerIcon;
        const isMinimized = tag.minimized;
        return(
            <span onMouseOver={::this.showMinimizerIcon} onMouseLeave={::this.hideMinimizerIcon}>
                {hasMinimizer && <div className={styles.minimized_icon} style={{marginLeft: `${XML_TAG_INDENT - 10}px`}}><TooltipFontIcon tooltip={isMinimized ? 'Maximize' : 'Minimize'} value={isMinimized ? 'add' : 'remove'} onClick={::this.toggleTag}/></div>}
                <div className={styles.tag} style={{paddingLeft: `${XML_TAG_INDENT}px`}}>
                    <span onMouseOver={::this.showTagIcons} onMouseLeave={::this.hideTagIcons} style={{position: 'relative'}}>
                        <span className={styles.bracket}>{`<${isDeclaration ? '?' : ''}`}</span>
                        <span className={styles.name_open} onClick={::this.showUpdateTagPopup}>{tag.name}</span>
                        {hasUpdateTagPopup && <ChangeTag tag={tag} change={update} close={::this.hideUpdateTagPopup} mode={'update'}/>}
                        {hasAddTagPopup && <ChangeTag parent={tag} tag={addTag} change={update} close={::this.hideAddTagPopup} mode={'add'}/>}
                        {this.renderProperties()}
                        {hasAddPropertyIcon && <TooltipFontIcon tooltip={'Add Property'} value={'add_circle_outline'} className={styles.add_property_icon} onClick={::this.showAddPropertyPopup}/>}
                        {hasAddPropertyPopup && <ChangeProperty property={property} change={::this.addProperty} close={::this.hideAddPropertyPopup} mode={'add'}/>}
                        {!tag.tags && <span className={styles.bracket}>{isDeclaration ? '?' : '/'}</span>}
                        <span className={styles.bracket}>{'>'}</span>
                        {hasDeleteTagIcon && <TooltipFontIcon tooltip={'Delete Tag'} value={'delete'} className={styles.delete_icon} onClick={deleteTag ? deleteTag : null}/>}
                        {hasAddTagIcon && tag.valueType !== TAG_VALUE_TYPES.TEXT && <TooltipFontIcon tooltip={'Add Tag'} value={'add_circle_outline'} className={styles.add_tag_icon_inside} onClick={::this.showAddTagPopup}/>}
                    </span>
                    {
                        tag.tags &&
                        <React.Fragment>
                            {this.renderSubTags()}
                            <span>
                                <span className={styles.bracket}>{'</'}</span>
                                <span className={styles.name_close}>{tag.name}</span>
                                <span className={styles.bracket}>{'>'}</span>
                            </span>
                        </React.Fragment>
                    }
                </div>
            </span>
        );
    }
}

Tag.propTypes = {
    tag: PropTypes.instanceOf(CTag).isRequired,
    isDeclaration: PropTypes.bool,
    update: PropTypes.func.isRequired,
    deleteTag: PropTypes.func.isRequired,
};

Tag.defaultProps = {
    isDeclaration: false,
};


export default Tag;