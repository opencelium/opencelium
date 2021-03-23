import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
    };
}

@connect(mapStateToProps, {})
class IfOperator extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.operator);
    }

    render(){
        const {currentItem, operator, isNotDraggable} = this.props;
        const isCurrentOperator = currentItem ? currentItem.id === operator.id : false;
        const textX = '50%';
        const textY = '50%';
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isCurrentOperator ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`} onMouseDown={::this.onMouseDown} points={points}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {operator.label}
                </text>
            </svg>
        );
    }
}

IfOperator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
};

IfOperator.defaultProps = {
    isNotDraggable: false,
};

export default IfOperator;