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
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import styles from "@themes/default/content/connections/connection_overview_2";

export const OPERATOR_SIZE = 60;

export default class COperator{

    constructor(operator) {
        this._id = operator && operator.hasOwnProperty('id') ? operator.id : '';
        this._type = operator && operator.hasOwnProperty('type') ? operator.type : '';
        this._label = operator && operator.hasOwnProperty('label') ? operator.label : '';
        this._x = operator && operator.hasOwnProperty('x') ? operator.x : 0;
        this._y = operator && operator.hasOwnProperty('y') ? operator.y : 0;
        this._width = OPERATOR_SIZE;
        this._height = OPERATOR_SIZE;
        this._connector = operator && operator.hasOwnProperty('connector') ? operator.connector : null;
        this._invoker = operator && operator.hasOwnProperty('invoker') ? operator.invoker : null;
        this._entity = operator && operator.hasOwnProperty('entity') ? operator.entity : null;
        if(!(this._entity instanceof COperatorItem)){
            this._entity = COperatorItem.createOperatorItem(this._entity);
        }
    }

    get id(){
        return this._id;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = type;
    }

    get label(){
        return this._label;
    }

    set label(label){
        this._label = label;
    }

    get x(){
        return this._x;
    }

    set x(x){
        this._x = x;
    }

    get y(){
        return this._y;
    }

    set y(y){
        this._y = y;
    }

    get width(){
        return this._width;
    }

    set width(width){
        this._width = width;
    }

    get height(){
        return this._height;
    }

    set height(height){
        this._height = height;
    }

    get connector(){
        return this._connector;
    }

    set connector(connector){
        this._connector = connector;
    }

    get invoker(){
        return this._invoker;
    }

    set invoker(invoker){
        this._invoker = invoker;
    }

    get entity(){
        return this._entity;
    }

    get items(){
        return this._items;
    }

    set items(items){
        this._items = items;
    }

    get arrows(){
        return this._arrows;
    }

    set arrows(arrows){
        this._arrows = arrows;
    }

    static renderLoopOperator(props, actions = {onSelect: () => {}, onDelete: () => {}}){
        const {operator, isNotDraggable, isCurrent, isHighlighted} = props;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const closeX = 40;
        const closeY = 0;
        return(
            <svg x={operator.x} y={operator.y} className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onMouseDown={actions.onSelect} points={points}/>
                <svg className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} onMouseDown={actions.onSelect} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                    <path onMouseDown={actions.onSelect} d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    <path onMouseDown={actions.onSelect} d="M0 0h24v24H0z" fill="none"/>
                </svg>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={'55'} y={'10'}>
                    {operator.entity.iterator}
                </text>
                {isCurrent &&
                    <svg x={closeX} y={closeY}>
                        <path className={styles.process_delete} onMouseDown={actions.onDelete} xmlns="http://www.w3.org/2000/svg" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                }
            </svg>
        );
    }

    static renderIfOperator(props, actions = {onSelect: () => {}, onDelete: () => {}}){
        const {operator, isNotDraggable, isCurrent, isHighlighted} = props;
        const textX = '50%';
        const textY = '50%';
        const closeX = 40;
        const closeY = 0;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onMouseDown={actions.onSelect} points={points}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {'if'}
                </text>
                {isCurrent &&
                    <svg x={closeX} y={closeY}>
                        <path className={styles.process_delete} onMouseDown={actions.onDelete} xmlns="http://www.w3.org/2000/svg" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                }
            </svg>
        );
    }

    setCoordinates(coordinates){
        if(coordinates) {
            if (coordinates.hasOwnProperty('x')) {
                this._x = coordinates.x;
            }
            if (coordinates.hasOwnProperty('y')) {
                this._y = coordinates.y;
            }
        }
    }

    getObject(){
        return {
            id: this._id,
            type: this._type,
            label: this._label,
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            connector: this._connector,
            invoker: this._invoker,
            entity: this._entity.getObject(),
        };
    }
}