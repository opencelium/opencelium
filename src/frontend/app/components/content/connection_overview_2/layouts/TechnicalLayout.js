import React from 'react';
import SvgLayout from "@decorators/SvgLayout";
import {connect} from "react-redux";
import {setCurrentItem, setCurrentSubItem} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";

function mapStateToProps(state){
    const {currentItem} = mapItemsToClasses(state);
    return{
        currentItem,
        items: currentItem ? currentItem.items : [],
        arrows: currentItem ? currentItem.arrows : [],
    };
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem})
@SvgLayout({layoutId: 'technical_layout', svgId: 'technical_layout_svg', dragAndDropStep: 10, isDraggable: false, isScalable: false})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
    }

    render(){
        return null;
    }
}

export default TechnicalLayout;