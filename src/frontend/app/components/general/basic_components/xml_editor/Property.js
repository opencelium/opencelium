import React from 'react';
import PropTypes from 'prop-types';
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CTag from "@classes/components/general/basic_components/CTag";
import CProperty from "@classes/components/general/basic_components/CProperty";
import ChangeProperty from "@basic_components/xml_editor/ChangeProperty";

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

    render() {
        const {hasRemoveIcon, hasUpdatePopup} = this.state;
        const {property, update} = this.props;
        return(
            <span style={{position: 'relative'}}>
                <span className={styles.property} onMouseOver={::this.showRemoveIcon} onMouseLeave={::this.hideRemoveIcon} onClick={::this.showUpdatePopup}>
                    <span className={styles.name}>{property.name}</span><span className={styles.value}>{`="${property.value}"`}</span>
                    {hasRemoveIcon && <TooltipFontIcon tooltip={'Delete Attribute'} value={'delete'} className={styles.remove_icon} onClick={::this.removeProperty}/>}
                </span>
                {hasUpdatePopup && <ChangeProperty property={property} change={update} close={::this.hideUpdatePopup} mode={'update'}/>}
            </span>
        );
    }

}

Property.propTypes = {
    property: PropTypes.instanceOf(CProperty).isRequired,
    update: PropTypes.func.isRequired,
    tag: PropTypes.instanceOf(CTag).isRequired,
};

export default Property;