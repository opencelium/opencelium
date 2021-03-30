import React from 'react';
import {connect} from 'react-redux';
import SvgLayout from "@decorators/SvgLayout";
import {setCurrentItem, setItems} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, items} = mapItemsToClasses(state);
    return{
        currentItem,
        items,
        arrows: connectionOverview.get('arrows'),
    };
}

@connect(mapStateToProps, {setCurrentItem, setItems})
@SvgLayout({layoutId: 'business_layout', svgId: 'business_layout_svg', dragAndDropStep: 5, isDraggable: true, isScalable: false})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
    }

    render(){
        return null;
    }
}

export default BusinessLayout;