import React from 'react';
import {connect} from "react-redux";
import {setCurrentItem, setCurrentSubItem} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import Svg from "@components/content/connection_overview_2/layouts/Svg";
import PropTypes from "prop-types";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import SettingsPanel from "@components/content/connection_overview_2/layouts/SettingsPanel";
import styles from "@themes/default/content/connections/connection_overview_2";

function mapStateToProps(state){
    const {currentItem} = mapItemsToClasses(state);
    return{
        currentItem,
        items: currentItem ? currentItem.items : [],
        arrows: currentItem ? currentItem.arrows : [],
    };
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    render(){
        const {isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, detailsPosition, ...svgProps} = this.props;
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <SettingsPanel
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    title={'Technical Layout'}
                />
                <Svg
                    {...svgProps}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={false}
                    isScalable={false}
                />
            </div>
        );
    }
}

TechnicalLayout.propTypes = {
    detailsPosition: PropTypes.oneOf(['right', 'left']).isRequired,
    isLayoutMinimized: PropTypes.bool.isRequired,
    minimizeLayout: PropTypes.func.isRequired,
    maximizeLayout: PropTypes.func.isRequired,
    replaceLayouts: PropTypes.func.isRequired,
    isDetailsMinimized: PropTypes.bool,
};

TechnicalLayout.defaultProps = {
    isDetailsMinimized: false,
};

export default TechnicalLayout;