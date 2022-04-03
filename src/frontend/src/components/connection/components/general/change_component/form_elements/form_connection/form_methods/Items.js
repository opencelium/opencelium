

/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import MethodItem from "./method/MethodItem";
import OperatorItem from "./operator/OperatorItem";
import CConnectorItem, {
    CONNECTOR_FROM,
} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import FontIcon from "@basic_components/FontIcon";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import styles from '@themes/default/general/change_component.scss';
import {DEFAULT_COLOR} from "@classes/components/content/connection/operator/CStatement";

import Tooltip from 'react-toolbox/lib/tooltip';
import InputHierarchy from "@basic_components/inputs/input_hierarchy/InputHierarchy";
import Slider from "react-slick";
import {DEFAULT_PAGE_LIMIT} from "@classes/components/content/connection/CConnectorPagination";
import MethodPlaceholder from "@change_component/form_elements/form_connection/form_methods/method/MethodPlaceholder";

const HistoryColor = (props) => {
    const {color, children, ...restProps} = props;
    return <div {...restProps} className={styles.history_color} style={{background: color}}>{children}</div>;
};
const TooltipColor = Tooltip(HistoryColor);


/**
 * Items component
 */
class Items extends Component{

    constructor(props){
        super(props);

        this.state = {
            pointerTop: 35,
            isHierarchyOpened: false,
        };
    }

    componentDidUpdate(){
        const {pointerTop} = this.state;
        let {connector} = this.props;
        let connectorType = connector.getConnectorType();
        let currentItem = connector.getCurrentItem();
        const isAnimating = connector.pagination.isAnimating;
        if(currentItem && !isAnimating) {
            let child = document.getElementById(`${currentItem.index}__${connectorType}`);
            if (child) {
                let nextTop = child.offsetTop + 18 < 35 ? 35 : child.offsetTop + 18;
                if(currentItem.index !== '0' && currentItem instanceof CMethodItem){
                    nextTop += 16;
                }
                if(pointerTop !== nextTop) {
                    this.setState({pointerTop: nextTop});
                }
            }
        }
    }

    loadPrevPage(){
        const {connector, updateEntity} = this.props;
        connector.pagination.isAnimating = true;
        connector.pagination.animationDirection = 'down';
        updateEntity();
        setTimeout(() => {
            this.slider.slickPrev();
            setTimeout(() => {
                connector.pagination.isAnimating = false;
                connector.pagination.animationDirection = '';
                connector.loadPage(connector.pagination.currentPageNumber - 1);
                updateEntity();
            }, 1000);
        }, 300);
    }

    loadNextPage(){
        const {connector, updateEntity} = this.props;
        connector.pagination.isAnimating = true;
        connector.pagination.animationDirection = 'up';
        updateEntity();
        setTimeout(() => {
            this.slider.slickNext();
            setTimeout(() => {
                connector.pagination.isAnimating = false;
                connector.pagination.animationDirection = '';
                connector.loadPage(connector.pagination.currentPageNumber + 1);
                updateEntity();
            }, 1000);
        }, 300);
    }

    setCurrentItem(e, item){
        this.props.connector.setCurrentItem(item);
        this.props.updateEntity();
    }

    openHierarchy(){
        this.setState({isHierarchyOpened: true});
    }

    closeHierarchy(){
        this.setState({isHierarchyOpened: false});
    }

    renderHistory(){
        const {connector} = this.props;
        const history = connector.operatorsHistory;
        return (
            <div className={styles.operators_history}>
                {
                    history.map((operator, key) => {
                        //let field = operator.condition && operator.condition.leftStatement ? operator.condition.leftStatement.field : '';
                        let typeTooltip = operator.type ? `${operator.type} ${operator.iterator}` : '';
                        let color = operator.condition && operator.condition.leftStatement ? operator.condition.leftStatement.color : '';
                        const conditionMethod = connector.getMethodByColor(color);
                        let fieldTooltip = conditionMethod ? conditionMethod.name : '';
                        let icon =
                            <TooltipFontIcon
                                tooltip={typeTooltip}
                                value={operator.type === 'if' ? 'call_split' : 'loop'}
                                tooltipPosition={'top'}
                            />;

                        const colorDiv = color !== '' && color !== DEFAULT_COLOR ? <TooltipColor tooltip={fieldTooltip} color={color} tooltipPosition={'top'} /> : null;
                        let arrow = key !== 0 ? <FontIcon value={'keyboard_arrow_right'} className={styles.history_arrow}/> : null;
                        return (
                            <React.Fragment key={operator.uniqueIndex}>
                                {arrow}
                                <div className={styles.history_element} key={operator._uniqueIndex} onClick={(e) => this.setCurrentItem(e, operator)}>
                                    {icon}
                                    {colorDiv}
                                </div>
                            </React.Fragment>
                        );
                    })
                }
            </div>
        );
    }

    renderNavigation(){
        const {connector} = this.props;
        const animationDirection = connector.pagination.animationDirection;
        const isAnimating = connector.pagination.isAnimating;
        if(connector.pagination.pageAmount > 1) {
            let isUpDisable = connector.pagination.currentPageNumber === 0 || isAnimating;
            let isDownDisable = connector.pagination.currentPageNumber === connector.pagination.pageAmount - 1 || isAnimating;
            let currentProgress = connector.currentProgress;
            let currentItem = connector.getCurrentItem();
            let closureNextItems = connector.pagination.closureNextItems;
            let closurePreviousItems = connector.pagination.closurePreviousItems;
            if(isAnimating && currentItem){
                switch (animationDirection) {
                    case 'up':
                        currentItem = closureNextItems.length > 0 && closureNextItems[DEFAULT_PAGE_LIMIT] ? closureNextItems[DEFAULT_PAGE_LIMIT] : currentItem;
                        break;
                    case 'down':
                        currentItem = closurePreviousItems.length > 0 ? closurePreviousItems[0] : currentItem;
                        break;
                }
                currentProgress = connector.getCurrentProgress(currentItem);
            }
            let currentProgressHeight = Math.ceil((currentProgress * 25) / 100);
            let transitionProperty = isAnimating ? 'height 1s linear 0.3s' : 'height 0.3s linear 0s';
            return (
                <div className={styles.items_arrows}>
                    <TooltipFontIcon tooltip={'Up'} value={'keyboard_arrow_up'} onClick={isUpDisable ? null : (a) => this.loadPrevPage(a)}
                                     className={`${styles.items_arrow_up} ${isUpDisable ? styles.item_arrow_disable : ''}`}/>
                     <div className={styles.items_navigation_bar}>
                         <div style={{height: currentProgressHeight, transition: transitionProperty}} className={styles.items_navigation_current}/>
                     </div>
                    <TooltipFontIcon tooltip={'Down'} value={'keyboard_arrow_down'} onClick={isDownDisable ? null : (a) => this.loadNextPage(a)}
                                     className={`${styles.items_arrow_down} ${isDownDisable ? styles.item_arrow_disable : ''}`}/>
                </div>
            );
        }
    }

    renderItems() {
        const {connection, connector, updateEntity, readOnly, isDraft} = this.props;
        const animationDirection = connector.pagination.animationDirection;
        const isAnimating = connector.pagination.isAnimating;
        let allItems = isAnimating ? animationDirection === 'down' ? connector.pagination.closurePreviousItems : connector.pagination.closureNextItems : connector.pagination.currentItems;
        let allComponents = [];
        for(let i = 0; i < allItems.length; i++){
            if(allItems[i] instanceof CMethodItem){
                allComponents.push(<MethodItem key={allItems[i].uniqueIndex} isDraft={isDraft} index={i} firstItemIndex={allItems[0].index} readOnly={readOnly} connection={connection} connector={connector} method={allItems[i]} updateEntity={updateEntity}/>);
            }
            if(allItems[i] instanceof COperatorItem){
                allComponents.push(<OperatorItem key={allItems[i].uniqueIndex} index={i} firstItemIndex={allItems[0].index} readOnly={readOnly} connection={connection} connector={connector} operator={allItems[i]} updateEntity={updateEntity}/>);
            }
        }
        let placeholders = DEFAULT_PAGE_LIMIT - allItems.length % DEFAULT_PAGE_LIMIT;
        if(isAnimating) {
            for (let i = 0; i < placeholders; i++) {
                allComponents.push(<MethodPlaceholder key={`placeholder_${i}`}/>);
            }
        }
        return allComponents;
    }

    renderPointer() {
        const {pointerTop} = this.state;
        let {connector} = this.props;
        let connectorType = connector.getConnectorType();
        let currentItem = connector.getCurrentItem();
        let styles = {cursor: 'default', position: 'absolute', right: '-25px', top: `${pointerTop}px`, transition: '0.2s all'};
        if(currentItem) {
            return (
                <TooltipFontIcon value={'arrow_back'} tooltip={connectorType === CONNECTOR_FROM ? 'Left Pointer' : 'Right Pointer'} wrapStyles={styles}/>
            );
        }
        return null;
    }

    render(){
        const {isHierarchyOpened} = this.state;
        const {connector, isDraft} = this.props;
        const history = connector.operatorsHistory;
        const isAnimating = connector.pagination.isAnimating;
        const animationDirection = connector.pagination.animationDirection;
        const sliderSettings = {
            vertical: true,
            slidesToShow: DEFAULT_PAGE_LIMIT,
            slidesToScroll: DEFAULT_PAGE_LIMIT,
            infinite: false,
            dots: false,
            speed: 1000,
            arrows: false,
            initialSlide: animationDirection === 'down' && isAnimating ? DEFAULT_PAGE_LIMIT : 0
        };
        return (
            <div className={styles.items}>
                <InputHierarchy
                    id={`input_hierarchy_${connector.getConnectorType()}${isDraft && '_draft'}`}
                    hierarchy={connector.getObject()}
                    currentItem={connector.getCurrentItem()}
                    onItemClick={(a,b) => this.setCurrentItem(a, b)}
                    onAppear={(a) => this.openHierarchy(a)}
                    onDisappear={(a) => this.closeHierarchy(a)}
                />
                <div className={styles.history_label}>
                    <TooltipFontIcon tooltip={'History'} value={'history'} style={{color: history.length === 0 ? '#eee' : 'black'}} className={styles.icon}/>
                    {
                        history.length > 0
                        ?
                            <span className={styles.colon}>:</span>
                        :
                            null
                    }
                </div>
                {this.renderHistory()}
                <div style={{opacity: isHierarchyOpened ? 0.5 : 1}}>
                    {this.renderNavigation()}
                    {
                        isAnimating ?

                            <Slider ref={c => (this.slider = c)}  {...sliderSettings}>
                            {
                                this.renderItems()
                            }
                            </Slider>
                            :
                            <div style={{padding: '2px 1px'}}>
                                {this.renderItems()}
                            </div>
                    }
                    {this.renderPointer()}
                </div>
            </div>
        );
    }
}

Items.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
};

Items.defaultProps = {
    isDraft: false,
};

export default Items;