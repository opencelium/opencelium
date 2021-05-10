/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CCoordinates from "@classes/components/content/connection_overview_2/CCoordinates";
import styles from "@themes/default/content/connections/connection_overview_2.scss";

export const ARROW_WIDTH = 2;


class Arrow extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {from, to, isHighlighted} = this.props;
        if(!from || !to){
            return null;
        }
        let {line1, line2, arrow} = CCoordinates.getLinkCoordinates(from, to);
        return(
            <React.Fragment>
                {line1 && <line id={`${from.id}_${to.id}_line1`} className={`${isHighlighted ? styles.highlighted_arrow : ''} line1`} x1={line1.x1} y1={line1.y1} x2={line1.x2} y2={line1.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH}/>}
                {line2 && <line id={`${from.id}_${to.id}_line2`} strokeLinecap={"round"} className={`${isHighlighted ? styles.highlighted_arrow : ''} line2`} x1={line2.x1} y1={line2.y1} x2={line2.x2} y2={line2.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH}/>}
                {arrow && <line id={`${from.id}_${to.id}_arrow`} className={`${isHighlighted ? styles.highlighted_arrow : ''} arrow`} x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} stroke="#000"
                      strokeWidth={ARROW_WIDTH} markerEnd={`url(#arrow_head_right${isHighlighted ? '_highlighted' : ''})`}/>}
            </React.Fragment>
        );
    }
}

Arrow.propTypes = {
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
    isHighlighted: PropTypes.bool,
};

Arrow.defaultProps = {
    isHighlighted: false,
};

export default Arrow;