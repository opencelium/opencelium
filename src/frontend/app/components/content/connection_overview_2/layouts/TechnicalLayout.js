import React from 'react';
import {connect} from "react-redux";
import {setCurrentItem, setCurrentSubItem} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import Svg from "@components/content/connection_overview_2/layouts/Svg";
import PropTypes from "prop-types";
import SettingsPanel from "@components/content/connection_overview_2/layouts/SettingsPanel";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation} from "@actions/connection_overview_2/set";
import {PANEL_LOCATION} from "@utils/constants/app";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem} = mapItemsToClasses(state);
    return{
        currentItem,
        items: currentItem ? currentItem.items : [],
        arrows: currentItem ? currentItem.arrows : [],
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem, setTechnicalLayoutLocation})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW && !this.props.isLayoutMinimized){
            this.props.minimizeLayout();
        }
    }

    setLocation(data){
        const {businessLayoutLocation, setTechnicalLayoutLocation} = this.props;
        if(businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setTechnicalLayoutLocation(data);
        }
    }

    render(){
        const {isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, detailsPosition, technicalLayoutLocation, ...svgProps} = this.props;
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <SettingsPanel
                    isVisible={technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW}
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={::this.setLocation}
                    location={technicalLayoutLocation}
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