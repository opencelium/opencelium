/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import MethodItem from "./method/MethodItem";
import OperatorItem from "./operator/OperatorItem";
import CConnectorItem, {
    CONNECTOR_FROM,
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import CMethodItem from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import COperatorItem from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {DEFAULT_COLOR} from "@entity/connection/components/classes/components/content/connection/operator/CStatement";

import Tooltip from 'react-toolbox/lib/tooltip';
import InputHierarchy from "@entity/connection/components/components/general/basic_components/inputs/input_hierarchy/InputHierarchy";
import Slider from "react-slick";
import {DEFAULT_PAGE_LIMIT} from "@entity/connection/components/classes/components/content/connection/CConnectorPagination";
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

        this.slider = null;

        this._itemsCache = {
            key: '',
            value: [],
        };

        this._historyCache = {
            key: '',
            value: null,
        };

        this.handleOpenHierarchy = this.openHierarchy.bind(this);
        this.handleCloseHierarchy = this.closeHierarchy.bind(this);
        this.handleLoadPrevPage = this.loadPrevPage.bind(this);
        this.handleLoadNextPage = this.loadNextPage.bind(this);
        this.handleUpdateEntity = this.updateEntity.bind(this);
        this.setSliderRef = this.setSliderRef.bind(this);
    }

    componentDidMount() {
        this.syncPointerTop();
    }

    componentDidUpdate() {
        this.syncPointerTop();
    }

    updateEntity(e = null) {
        const {updateEntity} = this.props;
        if (e === null) {
            updateEntity();
        } else {
            updateEntity(e);
        }
    }

    setSliderRef(c) {
        this.slider = c;
    }

    getCurrentVisibleItems() {
        const {connector} = this.props;
        const animationDirection = connector.pagination.animationDirection;
        const isAnimating = connector.pagination.isAnimating;

        return isAnimating
            ? animationDirection === 'down'
                ? connector.pagination.closurePreviousItems
                : connector.pagination.closureNextItems
            : connector.pagination.currentItems;
    }

    getPointerTop() {
        const {connector} = this.props;
        const {pointerTop} = this.state;
        const connectorType = connector.getConnectorType();
        const currentItem = connector.getCurrentItem();
        const isAnimating = connector.pagination.isAnimating;

        if (!currentItem || isAnimating) {
            return pointerTop;
        }

        const child = document.getElementById(`${currentItem.index}__${connectorType}`);
        if (!child) {
            return pointerTop;
        }

        let nextTop = child.offsetTop + 18 < 35 ? 35 : child.offsetTop + 18;

        if (currentItem.index !== '0' && currentItem instanceof CMethodItem) {
            nextTop += 16;
        }

        return nextTop;
    }

    syncPointerTop() {
        const nextTop = this.getPointerTop();
        if (nextTop !== this.state.pointerTop) {
            this.setState({pointerTop: nextTop});
        }
    }

    loadPrevPage(){
        const {connector} = this.props;
        connector.pagination.isAnimating = true;
        connector.pagination.animationDirection = 'down';
        this.updateEntity();

        setTimeout(() => {
            if (this.slider) {
                this.slider.slickPrev();
            }

            setTimeout(() => {
                connector.pagination.isAnimating = false;
                connector.pagination.animationDirection = '';
                connector.loadPage(connector.pagination.currentPageNumber - 1);
                this.updateEntity();
            }, 1000);
        }, 300);
    }

    loadNextPage(){
        const {connector} = this.props;
        connector.pagination.isAnimating = true;
        connector.pagination.animationDirection = 'up';
        this.updateEntity();

        setTimeout(() => {
            if (this.slider) {
                this.slider.slickNext();
            }

            setTimeout(() => {
                connector.pagination.isAnimating = false;
                connector.pagination.animationDirection = '';
                connector.loadPage(connector.pagination.currentPageNumber + 1);
                this.updateEntity();
            }, 1000);
        }, 300);
    }

    setCurrentItem(e, item){
        this.props.connector.setCurrentItem(item);
        this.updateEntity();
    }

    openHierarchy(){
        if (!this.state.isHierarchyOpened) {
            this.setState({isHierarchyOpened: true});
        }
    }

    closeHierarchy(){
        if (this.state.isHierarchyOpened) {
            this.setState({isHierarchyOpened: false});
        }
    }

    getHistoryRenderKey() {
        const {connector} = this.props;
        const history = connector.operatorsHistory || [];
        const currentItem = connector.getCurrentItem();

        return history.map((operator) => {
            const leftColor = operator.condition && operator.condition.leftStatement
                ? operator.condition.leftStatement.color
                : '';
            return `${operator.uniqueIndex}_${operator.index}_${operator.type}_${operator.iterator || ''}_${leftColor}`;
        }).join('|') + `__current_${currentItem ? currentItem.index : ''}`;
    }

    renderHistory(){
        const {connector} = this.props;
        const history = connector.operatorsHistory;
        const cacheKey = this.getHistoryRenderKey();

        if (this._historyCache.key === cacheKey) {
            return this._historyCache.value;
        }

        const rendered = (
            <div className={styles.operators_history}>
                {
                    history.map((operator, key) => {
                        const typeTooltip = operator.type ? `${operator.type} ${operator.iterator}` : '';
                        const color = operator.condition && operator.condition.leftStatement ? operator.condition.leftStatement.color : '';
                        const conditionMethod = connector.getMethodByColor(color);
                        const fieldTooltip = conditionMethod ? conditionMethod.name : '';

                        const icon = (
                            <TooltipFontIcon
                                tooltip={typeTooltip}
                                value={operator.type === 'if' ? 'call_split' : 'loop'}
                                tooltipPosition={'top'}
                            />
                        );

                        const colorDiv = color !== '' && color !== DEFAULT_COLOR
                            ? <TooltipColor tooltip={fieldTooltip} color={color} tooltipPosition={'top'} />
                            : null;

                        const arrow = key !== 0
                            ? <FontIcon value={'keyboard_arrow_right'} className={styles.history_arrow}/>
                            : null;

                        return (
                            <React.Fragment key={operator.uniqueIndex}>
                                {arrow}
                                <div
                                    className={styles.history_element}
                                    onClick={(e) => this.setCurrentItem(e, operator)}
                                >
                                    {icon}
                                    {colorDiv}
                                </div>
                            </React.Fragment>
                        );
                    })
                }
            </div>
        );

        this._historyCache = {
            key: cacheKey,
            value: rendered,
        };

        return rendered;
    }

    renderNavigation(){
        const {connector} = this.props;
        const animationDirection = connector.pagination.animationDirection;
        const isAnimating = connector.pagination.isAnimating;

        if(connector.pagination.pageAmount > 1) {
            const isUpDisable = connector.pagination.currentPageNumber === 0 || isAnimating;
            const isDownDisable = connector.pagination.currentPageNumber === connector.pagination.pageAmount - 1 || isAnimating;

            let currentProgress = connector.currentProgress;
            let currentItem = connector.getCurrentItem();
            const closureNextItems = connector.pagination.closureNextItems;
            const closurePreviousItems = connector.pagination.closurePreviousItems;

            if(isAnimating && currentItem){
                switch (animationDirection) {
                    case 'up':
                        currentItem = closureNextItems.length > 0 && closureNextItems[DEFAULT_PAGE_LIMIT]
                            ? closureNextItems[DEFAULT_PAGE_LIMIT]
                            : currentItem;
                        break;
                    case 'down':
                        currentItem = closurePreviousItems.length > 0
                            ? closurePreviousItems[0]
                            : currentItem;
                        break;
                }
                currentProgress = connector.getCurrentProgress(currentItem);
            }

            const currentProgressHeight = Math.ceil((currentProgress * 25) / 100);
            const transitionProperty = isAnimating
                ? 'height 1s linear 0.3s'
                : 'height 0.3s linear 0s';

            return (
                <div className={styles.items_arrows}>
                    <TooltipFontIcon
                        tooltip={'Up'}
                        value={'keyboard_arrow_up'}
                        onClick={isUpDisable ? null : this.handleLoadPrevPage}
                        className={`${styles.items_arrow_up} ${isUpDisable ? styles.item_arrow_disable : ''}`}
                    />
                    <div className={styles.items_navigation_bar}>
                        <div
                            style={{height: currentProgressHeight, transition: transitionProperty}}
                            className={styles.items_navigation_current}
                        />
                    </div>
                    <TooltipFontIcon
                        tooltip={'Down'}
                        value={'keyboard_arrow_down'}
                        onClick={isDownDisable ? null : this.handleLoadNextPage}
                        className={`${styles.items_arrow_down} ${isDownDisable ? styles.item_arrow_disable : ''}`}
                    />
                </div>
            );
        }

        return null;
    }

    getItemsRenderKey(allItems) {
        const {connector, readOnly, isDraft, connection} = this.props;
        const animationDirection = connector.pagination.animationDirection;
        const isAnimating = connector.pagination.isAnimating;
        const currentItem = connector.getCurrentItem();

        const itemsKey = allItems.map((item) => {
            if (item instanceof CMethodItem) {
                return [
                    'm',
                    item.uniqueIndex,
                    item.index,
                    item.name,
                    item.label,
                    item.color,
                    item.isToggled,
                    item.isDisabled,
                    item.error?.hasError ? 1 : 0
                ].join('_');
            }

            if (item instanceof COperatorItem) {
                return [
                    'o',
                    item.uniqueIndex,
                    item.index,
                    item.type,
                    item.iterator,
                    item.isMinimized,
                    item.isToggled,
                    item.isDisabled,
                    item.error?.hasError ? 1 : 0
                ].join('_');
            }

            return 'unknown';
        }).join('|');

        return [
            connector.getConnectorType(),
            readOnly ? '1' : '0',
            isDraft ? '1' : '0',
            isAnimating ? '1' : '0',
            animationDirection,
            connector.pagination.currentPageNumber,
            currentItem ? currentItem.index : '',
            connection ? '1' : '0',
            itemsKey
        ].join('__');
    }

    renderItems() {
        const {connection, connector, readOnly, isDraft} = this.props;
        const isAnimating = connector.pagination.isAnimating;
        const allItems = this.getCurrentVisibleItems();
        const cacheKey = this.getItemsRenderKey(allItems);

        if (this._itemsCache.key === cacheKey) {
            return this._itemsCache.value;
        }

        const firstItemIndex = allItems.length > 0 ? allItems[0].index : '';

        const allComponents = allItems.map((item, i) => {
            if(item instanceof CMethodItem){
                return (
                    <MethodItem
                        key={item.uniqueIndex}
                        isDraft={isDraft}
                        index={i}
                        firstItemIndex={firstItemIndex}
                        readOnly={readOnly}
                        connection={connection}
                        connector={connector}
                        method={item}
                        updateEntity={this.handleUpdateEntity}
                    />
                );
            }

            if(item instanceof COperatorItem){
                return (
                    <OperatorItem
                        key={item.uniqueIndex}
                        index={i}
                        firstItemIndex={firstItemIndex}
                        readOnly={readOnly}
                        connection={connection}
                        connector={connector}
                        operator={item}
                        updateEntity={this.handleUpdateEntity}
                    />
                );
            }

            return null;
        }).filter(Boolean);

        let placeholders = DEFAULT_PAGE_LIMIT - allItems.length % DEFAULT_PAGE_LIMIT;
        if(isAnimating) {
            for (let i = 0; i < placeholders; i++) {
                allComponents.push(<MethodPlaceholder key={`placeholder_${i}`}/>);
            }
        }

        this._itemsCache = {
            key: cacheKey,
            value: allComponents,
        };

        return allComponents;
    }

    renderPointer() {
        const {pointerTop} = this.state;
        const {connector} = this.props;
        const connectorType = connector.getConnectorType();
        const currentItem = connector.getCurrentItem();

        if(currentItem) {
            return (
                <TooltipFontIcon
                    value={'arrow_back'}
                    tooltip={connectorType === CONNECTOR_FROM ? 'Left Pointer' : 'Right Pointer'}
                    wrapStyles={{
                        cursor: 'default',
                        position: 'absolute',
                        right: '-25px',
                        top: `${pointerTop}px`,
                        transition: '0.2s all'
                    }}
                />
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

        const renderedItems = this.renderItems();

        return (
            <div className={styles.items}>
                {!connector.isEmpty() && (
                    <InputHierarchy
                        id={`input_hierarchy_${connector.getConnectorType()}${isDraft && '_draft'}`}
                        hierarchy={connector.getObject()}
                        currentItem={connector.getCurrentItem()}
                        onItemClick={(a, b) => this.setCurrentItem(a, b)}
                        onAppear={this.handleOpenHierarchy}
                        onDisappear={this.handleCloseHierarchy}
                    />
                )}

                <div className={styles.history_label}>
                    {history.length > 0 && (
                        <TooltipFontIcon
                            tooltip={'History'}
                            value={'history'}
                            style={{color: history.length === 0 ? '#eee' : 'black'}}
                            className={styles.icon}
                        />
                    )}
                    {history.length > 0 ? <span className={styles.colon}>:</span> : null}
                </div>

                {this.renderHistory()}

                <div style={{opacity: isHierarchyOpened ? 0.5 : 1}}>
                    {this.renderNavigation()}

                    {isAnimating ? (
                        <Slider ref={this.setSliderRef} {...sliderSettings}>
                            {renderedItems}
                        </Slider>
                    ) : (
                        <div style={{padding: '2px 1px'}}>
                            {renderedItems}
                        </div>
                    )}

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