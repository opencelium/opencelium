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

import React from 'react';
import { connect } from "react-redux";
import { setCurrentTechnicalItem } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { mapItemsToClasses } from "../utils";
import Svg from "./Svg";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import { setModalCurrentTechnicalItem } from '@entity/connection/redux_toolkit/slices/ModalConnectionSlice';
import CConnectorItem, { CONNECTOR_FROM, CONNECTOR_TO } from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {
    addSelectAllAfterItemsKeyNavigation,
    removeSelectAllAfterItemsKeyNavigation
} from "@root/components/utils/key_navigation";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

function mapStateToProps(state, props) {
    const { connectionOverview, currentTechnicalItem, connection } = mapItemsToClasses(state, props.isModal);

    return {
        connectionOverviewState: connectionOverview,
        currentTechnicalItem,
        technicalLayoutLocation: connectionOverview.technicalLayoutLocation,
        connection,
    };
}

@GetModalProp()
@connect(
    mapStateToProps,
    { setCurrentTechnicalItem, setModalCurrentTechnicalItem },
    null,
    { forwardRef: true }
)
class TechnicalLayout extends React.Component {
    constructor(props) {
        super(props);

        this.layoutId = `${props.isModal ? 'modal_' : ''}technical_layout`;
        this.setCurrentTechnicalItem = props.isModal ? props.setModalCurrentTechnicalItem : props.setCurrentTechnicalItem;
        this.svgRef = React.createRef();

        this.layoutCache = {
            connection: null,
            items: [],
            arrows: [],
            fromConnectorPanelParams: null,
            toConnectorPanelParams: null,
        };

        this.handleSetCurrentItem = this.setCurrentItem.bind(this);
        this.handleDeleteProcess = this.deleteProcess.bind(this);
    }

    componentDidMount() {
        addSelectAllAfterItemsKeyNavigation(this);
    }

    componentWillUnmount() {
        removeSelectAllAfterItemsKeyNavigation(this);
    }

    getLayoutData(connection) {
        if (!connection) {
            return {
                items: [],
                arrows: [],
                fromConnectorPanelParams: null,
                toConnectorPanelParams: null,
            };
        }

        if (this.layoutCache.connection === connection) {
            return {
                items: this.layoutCache.items,
                arrows: this.layoutCache.arrows,
                fromConnectorPanelParams: this.layoutCache.fromConnectorPanelParams,
                toConnectorPanelParams: this.layoutCache.toConnectorPanelParams,
            };
        }

        const fromConnector = connection.fromConnector;
        const toConnector = connection.toConnector;

        const fromItems = fromConnector ? fromConnector.svgItems : [];
        const toItems = toConnector ? toConnector.svgItems : [];
        const fromArrows = fromConnector ? fromConnector.arrows : [];
        const toArrows = toConnector ? toConnector.arrows : [];

        const items = fromItems.length === 0
            ? toItems
            : toItems.length === 0
                ? fromItems
                : [...fromItems, ...toItems];

        const arrows = fromArrows.length === 0
            ? toArrows
            : toArrows.length === 0
                ? fromArrows
                : [...fromArrows, ...toArrows];

        const fromConnectorPanelParams = fromConnector
            ? {
                panelPosition: CConnectorItem.getPanelPosition(
                    fromItems,
                    fromConnector.shiftXForSvgItems
                ),
                rectPosition: CConnectorItem.getPanelRectPosition(
                    fromItems,
                    fromConnector.shiftXForSvgItems
                ),
                invokerName: fromConnector.title || fromConnector.invoker.name,
            }
            : null;

        const toConnectorPanelParams = toConnector
            ? {
                panelPosition: CConnectorItem.getPanelPosition(
                    toItems,
                    toConnector.shiftXForSvgItems
                ),
                rectPosition: CConnectorItem.getPanelRectPosition(
                    toItems,
                    toConnector.shiftXForSvgItems
                ),
                invokerName: toConnector.title || toConnector.invoker.name,
            }
            : null;

        this.layoutCache = {
            connection,
            items,
            arrows,
            fromConnectorPanelParams,
            toConnectorPanelParams,
        };

        return {
            items,
            arrows,
            fromConnectorPanelParams,
            toConnectorPanelParams,
        };
    }

    deleteProcess(process) {
        const { connection, updateConnection } = this.props;
        if (!connection || !process) return;

        const method = process.entity;
        const connector = connection.getConnectorByType(process.connectorType);

        if (!connector) return;

        if (connector.getConnectorType() === CONNECTOR_FROM) {
            connection.removeFromConnectorMethod(method);
        } else {
            connection.removeToConnectorMethod(method);
        }

        updateConnection(connection, { markDirty: true });

        const currentItem = connector.getCurrentItem();
        if (currentItem) {
            const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
            if (currentSvgElement) {
                this.setCurrentTechnicalItem(currentSvgElement.getObject());
            }
        }
    }

    setCurrentItem(currentItem) {
        if (!currentItem) return;

        const {
            connection,
            updateConnection,
            currentTechnicalItem,
        } = this.props;

        const nextIndex = currentItem?.entity?.index || '';
        const nextConnectorType = currentItem?.connectorType || '';

        const currentReduxIndex = currentTechnicalItem?.index || '';
        const currentReduxConnectorType = currentTechnicalItem?.connectorType || '';

        const isSameReduxItem =
            currentReduxIndex === nextIndex &&
            currentReduxConnectorType === nextConnectorType;

        if (!isSameReduxItem) {
            this.setCurrentTechnicalItem(currentItem.getObject());
        }

        if (!connection) return;

        const connector = connection.getConnectorByType(nextConnectorType);
        if (!connector) return;

        const currentItemInConnector = connector.getCurrentItem();
        const currentConnectorIndex = currentItemInConnector?.index || '';

        if (currentConnectorIndex !== nextIndex) {
            connector.setCurrentItem(currentItem.entity);
            updateConnection(connection, { markDirty: false });
        }
    }

    render() {
        const { setCreateElementPanelPosition } = this.props;
        const {
            setRef,
            connection,
            currentTechnicalItem,
            ...svgProps
        } = this.props;

        const {
            items,
            arrows,
            fromConnectorPanelParams,
            toConnectorPanelParams,
        } = this.getLayoutData(connection);

        const startingSvgY = -104;
        const svgStyle = {};

        return (
            <div id={this.layoutId} className={styles.technical_layout}>
                <Svg
                    {...svgProps}
                    ref={this.svgRef}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={true}
                    isScalable={true}
                    isItemDraggable={true}
                    setCurrentItem={this.handleSetCurrentItem}
                    deleteProcess={this.handleDeleteProcess}
                    currentItem={currentTechnicalItem}
                    style={svgStyle}
                    connection={connection}
                    items={items}
                    dragAndDropStep={1}
                    arrows={arrows}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                    setCreateElementPanelPosition={setCreateElementPanelPosition}
                    startingSvgX={-450}
                    startingSvgY={startingSvgY}
                />
            </div>
        );
    }
}

TechnicalLayout.propTypes = {};

TechnicalLayout.defaultProps = {};

export default TechnicalLayout;
