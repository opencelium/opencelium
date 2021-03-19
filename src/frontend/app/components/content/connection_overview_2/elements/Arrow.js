import React from 'react';
import PropTypes from 'prop-types';
import CCoordinates from "@classes/components/content/connection_overview_2/CCoordinates";

export const ARROW_WIDTH = 1;
export const ARROW_END_LENGTH = 10;

export const ARROW_MARGIN = 15;


class Arrow extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {from, to} = this.props;
        if(!from || !to){
            return null;
        }
        let {line1, line2, arrow} = CCoordinates.getLinkCoordinates(from, to);
        return(
            <React.Fragment>
                {line1 && <line id={`${from.id}_${to.id}_line1`} className={'line1'} x1={line1.x1} y1={line1.y1} x2={line1.x2} y2={line1.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH}/>}
                {line2 && <line id={`${from.id}_${to.id}_line2`} className={'line2'} x1={line2.x1} y1={line2.y1} x2={line2.x2} y2={line2.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH}/>}
                {arrow && <line id={`${from.id}_${to.id}_arrow`} className={'arrow'} x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH} markerEnd="url(#arrow_head_right)" />}
            </React.Fragment>
        );
    }
}

Arrow.propTypes = {
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
};

export default Arrow;