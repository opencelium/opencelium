/*
 * Copyright (C) <2020>  <becon GmbH>
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


import {
    DefaultNodeModel,
    DiagramEngine,
    DiagramModel,
    DiagramWidget,
} from "storm-react-diagrams";

import styles from '../../../../../../../themes/default/general/form_methods.scss';
import {isArray, setFocusById} from "../../../../../../../utils/app";
import Enhancement from "./enhancement/Enhancement";
import {
    FIELD_TYPE_REQUEST, FIELD_TYPE_RESPONSE,
} from "../utils";
import {CONNECTOR_FROM, CONNECTOR_TO} from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import CBindingItem from "../../../../../../../classes/components/content/connection/field_binding/CBindingItem";
import Dialog from "../../../../../basic_components/Dialog";


/**
 * Component Mapping
 */
class Mapping extends Component{

    constructor(props){
        super(props);
        this.state = {
            showEnhancement: false,
            currentBindingItem: [],
            currentEnhancement: null,
            currentWidth: window.innerWidth,
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.resize, false);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize, false);
    }

    resize = (e) => {
        this.setState({currentWidth: e.target.innerWidth});
    };

    /**
     * to set current enhancement
     */
    setCurrentEnhancement(enhancement){
        this.setState({currentEnhancement: enhancement});
    }

    /**
     * to show/hide enhancement
     */
    toggleEnhancement(){
        let currentBindingItem = this.state.currentBindingItem;
        if(this.state.showEnhancement) {
            currentBindingItem = [];
        }
        this.setState({
            showEnhancement: !this.state.showEnhancement,
            currentBindingItem,
        });
    }

    /**
     * to click on port of mapping
     */
    onClickPort(node){
        const {connection} = this.props;
        let bindings = [];
        let ports = node.ports;
        let port = Object.keys(ports).length > 0 ? ports[Object.keys(ports)[0]] : null;
        let links = port !== null && port.hasOwnProperty('links') ? port.links : [];
        for(let link in links){
            let source = links[link].sourcePort.parent;
            bindings.push({from: {color: source.color, field: source.name, type: FIELD_TYPE_RESPONSE}, enhancement: null, to: {color: node.color, field: node.name, type: FIELD_TYPE_REQUEST}});
        }
        connection.setCurrentFieldBindingTo(CBindingItem.createBindingItem({color: node.color, field: node.name, type: FIELD_TYPE_REQUEST}));
        let currentEnhancement = connection.getEnhancementByTo();
        this.setState({
            showEnhancement: !this.state.showEnhancement,
            currentBindingItem: bindings,
            currentEnhancement,
        });
    }

    /**
     * to add elements in model for displaying mapping
     */
    addNodesInModel(model, nodes){
        for(let i = 0; i < nodes.length; i++){
            model.addNode(nodes[i]);
        }
        return model;
    }

    /**
     * to add links between elements for displaying mapping
     */
    addLinksInModel(model, ports, nodes){
        for(let i = 0; i < ports.length; i++){
            let from = ports[i]['from'];
            if(!isArray(from)){
                from = [from];
            }
            for(let j = 0; j < from.length; j++) {
                let fromPort = this.findPort('fromConnector', from[j], nodes);
                let toPort = this.findPort('toConnector', ports[i]['to'], nodes);
                if (fromPort !== null && toPort !== null) {
                    let link = fromPort.link(toPort);
                    model.addLink(link);
                }
            }
        }
        return model;
    }

    /**
     * to find port in mapping
     */
    findPort(connectorType, data, allNodes){
        let value = data.length > 0 ? data[0] : data;
        if(value) {
            let color = value.color;
            let name = value.field;
            if (color !== '' && name !== '') {
                let nodes = connectorType === CONNECTOR_FROM ? allNodes.from : allNodes.to;
                if(nodes.length > 0) {
                    let result = nodes.find(item => item.color === color && item.name === name);
                    if(result) {
                        let ports = result.ports;
                        let keys = Object.keys(ports);
                        return ports[keys[0]];
                    }
                }
            }
        }
        return null;
    }

    /**
     * to update enhancement in entity
     */
    updateEnhancement(){
        const {currentEnhancement} = this.state;
        const {connection, updateEntity} = this.props;
        connection.updateEnhancement(currentEnhancement);
        updateEntity();
        this.toggleEnhancement();
    }

    /**
     * to get nodes and binding for displaying mapping
     */
    getNodes(connectorType = 'fromConnector'){
        const {currentWidth} = this.state;
        const {connection} = this.props;
        let fieldBindingItems = [];
        let nodes = [];
        let marginLeft = 0;
        const minIntend = 400;
        let flexIntend = 30;
        if(currentWidth >= 1200){
            marginLeft = 100;
        }
        if(currentWidth < 1200){
            marginLeft = 50;
            flexIntend = 0;
        }
        if(currentWidth < 990){
            marginLeft = 0;
            flexIntend = 0;
        }
        if(currentWidth < 768){
            marginLeft = 0;
            flexIntend = -210;
        }
        if(currentWidth < 576){
            marginLeft = 0;
            flexIntend = -260;
        }
        switch(connectorType){
            case CONNECTOR_FROM:
                fieldBindingItems = connection.getAllFieldBindingFrom();
                break;
            case CONNECTOR_TO:
                fieldBindingItems = connection.getAllFieldBindingTo();
                break;
            default:
                return [];
        }
        for (let i = 0; i < fieldBindingItems.length; i++) {
            let color = fieldBindingItems[i].color;
            let name = fieldBindingItems[i].field;
            if(color !== '' && name !== '') {
                let node = new DefaultNodeModel(name, color);
                let port = null;
                switch (connectorType) {
                    case CONNECTOR_FROM:
                        port = node.addOutPort("Out");
                        node.setPosition(marginLeft, 30 + i * 70);
                        break;
                    case CONNECTOR_TO:
                        port = node.addInPort("In");
                        node.setPosition(marginLeft + minIntend + flexIntend, 30 + i * 70);
                }
                if (port !== null) {
                    nodes.push(node);
                }
            }
        }
        return nodes;
    }

    renderEnhancement(){
        const {currentBindingItem, showEnhancement, currentEnhancement} = this.state;
        const {readOnly, getEnhancement} = this.props;
        let enhancement = currentEnhancement ? currentEnhancement : isArray(currentBindingItem) && currentBindingItem.length > 0 && currentBindingItem[0].hasOwnProperty('to') ? getEnhancement(currentBindingItem[0].to) :  null;
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.updateEnhancement}, {label: 'Cancel', onClick: ::this.toggleEnhancement}]}
                active={showEnhancement}
                onEscKeyDown={::this.toggleEnhancement}
                onOverlayClick={::this.toggleEnhancement}
                title={'Enhancement'}
                className={styles.enhancement_dialog}
                theme={{title: styles.enhancement_dialog_title}}
            >
                <div>
                    <Enhancement
                        binding={currentBindingItem}
                        setEnhancement={::this.setCurrentEnhancement}
                        readOnly={readOnly}
                        enhancement={enhancement}
                    />
                </div>
            </Dialog>
        );
    }

    render(){
        const {connection, tourClassNames} = this.props;
        let fromConnectorNodes = this.getNodes('fromConnector');
        let toConnectorNodes = this.getNodes('toConnector');
        let toBindings = connection.fieldBinding.filter(f => f.to.length !== 0);
        let maxLength = fromConnectorNodes.length > toConnectorNodes.length ? fromConnectorNodes.length : toConnectorNodes.length;
        let diagramStyles = {};
        if(maxLength > 0){
            diagramStyles.cursor = 'default';
            diagramStyles.height = (50 + 70 * maxLength) + 'px';
            diagramStyles.fontFamily = "'Roboto', 'Helvetica', 'Arial', sans-serif";
            diagramStyles.fontSize = '14px !important';
        }
        let engine = new DiagramEngine();
        engine.installDefaultFactories();
        let model = new DiagramModel();
        let allNodes = fromConnectorNodes.concat(toConnectorNodes);
        model = this.addNodesInModel(model, allNodes);
        model = this.addLinksInModel(model, toBindings, {from: fromConnectorNodes, to: toConnectorNodes});
        model.addListener({portOnClick: ::this.onClickPort});
        engine.setDiagramModel(model);
        model.setLocked(true);
        return (
            <div className={tourClassNames[1] ? tourClassNames[1] : ''}>
                <hr noshade="noshade" size="1" style={{marginTop: '40px'}} color={"#f0f0f0"}/>
                <div className={styles.mapping_area_title}>Mapping fields</div>
                {this.renderEnhancement()}
                <DiagramWidget
                    style={diagramStyles}
                    className={"srd-demo-canvas" + ' ' + styles.mapping_area}
                    diagramEngine={engine}
                    allowCanvasTranslation={false}
                    allowCanvasZoom={false}
                    maxNumberPointsPerLink={0}
                />
            </div>
        );

    }
}

Mapping.propTypes = {
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    updateEntity: PropTypes.func.isRequired,
    tourClassNames: PropTypes.array,
};

Mapping.defaultProps = {
    readOnly: true,
    tourClassNames: [],
};

export default Mapping;