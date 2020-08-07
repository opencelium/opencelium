import React from 'react';
import PropTypes from 'prop-types';
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import ChangeProperty from "@basic_components/xml_editor/ChangeProperty";
import XmlEditor from "@basic_components/xml_editor/XmlEditor";
import {checkReferenceFormat} from "@utils/app";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";

class Property extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            hasRemoveIcon: false,
            hasUpdatePopup: false,
        };
    }

    showRemoveIcon(){
        this.setState({
            hasRemoveIcon: true,
        });
    }

    hideRemoveIcon(){
        this.setState({
            hasRemoveIcon: false,
        });
    }

    showUpdatePopup(){
        this.setState({
            hasUpdatePopup: true,
        });
    }

    hideUpdatePopup(){
        this.setState({
            hasUpdatePopup: false,
        });
    }

    removeProperty(){
        const {tag, property, update} = this.props;
        tag.removeProperty(property.name);
        update();
    }

    renderValue(){
        const {property} = this.props;
        let isReference = checkReferenceFormat(property.value);
        if(isReference){
            return (
                <span>=<ReferenceValues references={property.value} styles={{padding: '0 12px', margin: '0 0 0 6px', width: 0, height: 0,fontSize: '12px'}} maxVisible={4} hasDelete={false}/></span>
            );
        }
        return(
            <span className={styles.value}>{`="${property.value}"`}</span>
        );
    }

    render() {
        const {hasRemoveIcon, hasUpdatePopup} = this.state;
        const {property, update, readOnly, ReferenceComponent, onReferenceClick} = this.props;
        return(
            <span style={{position: 'relative', display: 'inline-block'}}>
                <span id={`${property.uniqueIndex}_property`} className={`${styles.property} ${!readOnly ? styles.property_hovered : ''}`} onMouseOver={!readOnly ? ::this.showRemoveIcon : null} onMouseLeave={::this.hideRemoveIcon} onClick={!readOnly ? ::this.showUpdatePopup : null}>
                    <span className={styles.name}>{property.name}</span>
                    {this.renderValue()}
                    {hasRemoveIcon && !readOnly && <TooltipFontIcon tooltip={'Delete Attribute'} value={'delete'} className={styles.remove_icon} onClick={::this.removeProperty}/>}
                </span>
                {
                    hasUpdatePopup && !readOnly &&
                        <ChangeProperty correspondedId={`${property.uniqueIndex}_property`} property={property} change={update} close={::this.hideUpdatePopup}
                                        mode={'update'} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>
                }
            </span>
        );
    }

}

Property.propTypes = {
    property: PropTypes.instanceOf(CProperty).isRequired,
    update: PropTypes.func.isRequired,
    tag: PropTypes.instanceOf(CTag).isRequired,
    readOnly: PropTypes.bool,
};

Property.defaultProps = {
    readOnly: false,
};

export default Property;