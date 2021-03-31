import React from 'react';
import {connect} from 'react-redux';
import {setCurrentItem, setItems} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import Svg from "@components/content/connection_overview_2/layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import SettingsPanel from "@components/content/connection_overview_2/layouts/SettingsPanel";
import PropTypes from "prop-types";
import {setBusinessLayoutLocation} from "@actions/connection_overview_2/set";
import {PANEL_LOCATION} from "@utils/constants/app";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, items} = mapItemsToClasses(state);
    return{
        currentItem,
        items,
        arrows: connectionOverview.get('arrows'),
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

@connect(mapStateToProps, {setCurrentItem, setItems, setBusinessLayoutLocation})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'business_layout';
    }

    setLocation(data){
        const {technicalLayoutLocation, setBusinessLayoutLocation} = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setBusinessLayoutLocation(data);
        }
    }

    render(){
        const {isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, detailsPosition, businessLayoutLocation, ...svgProps} = this.props;
        return(
            <div id={this.layoutId} className={`${styles.business_layout}`}>
                <SettingsPanel
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={::this.setLocation}
                    location={businessLayoutLocation}
                    title={'Business Layout'}
                />
                <Svg
                    {...svgProps}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    dragAndDropStep={5}
                    isDraggable={true}
                    isScalable={false}
                />
            </div>
        );
    }
}

BusinessLayout.propTypes = {
    detailsPosition: PropTypes.oneOf(['right', 'left']).isRequired,
    isLayoutMinimized: PropTypes.bool.isRequired,
    minimizeLayout: PropTypes.func.isRequired,
    maximizeLayout: PropTypes.func.isRequired,
    replaceLayouts: PropTypes.func.isRequired,
};

export default BusinessLayout;