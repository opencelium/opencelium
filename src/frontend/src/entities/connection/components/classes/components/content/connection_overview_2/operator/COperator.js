
/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import COperatorItem from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";

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
        this._connectorType = operator && operator.hasOwnProperty('connectorType') ? operator.connectorType : '';
        this._invoker = operator && operator.hasOwnProperty('invoker') ? operator.invoker : null;
        this._entity = operator && operator.hasOwnProperty('entity') ? operator.entity : null;
        if(!(this._entity instanceof COperatorItem)){
            this._entity = COperatorItem.createOperatorItem(this._entity);
        }
        this._isDragged = operator && operator.hasOwnProperty('isDragged') ? operator.isDragged : false;
        this._isAvailableForDragging = operator && operator.hasOwnProperty('isAvailableForDragging') ? operator.isAvailableForDragging : false;
    }

    static getPoints(x, y, size = OPERATOR_SIZE){
        return `${x + size / 2},${y + 1} ${x + size - 1},${y + size / 2} ${x + size / 2},${y + size - 1} ${x + 1},${y + size / 2}`
    };

    get id(){
        return this._id;
    }

    getHtmlIdName(){
        return `${this._id}`
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

    get isDragged(){
        return this._isDragged;
    }

    set isDragged(isDragged){
        this._isDragged = isDragged;
    }

    get isAvailableForDragging(){
        return this._isAvailableForDragging;
    }

    set isAvailableForDragging(isAvailableForDragging){
        this._isAvailableForDragging = isAvailableForDragging;
    }

    get connectorType(){
        return this._connectorType;
    }

    set connectorType(connectorType){
        this._connectorType = connectorType;
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

    isHighlighted(currentOperator){
        return currentOperator ? this._id.indexOf(currentOperator.id) === 0 : false;
    }

    isCurrent(currentOperator){
        return currentOperator ? currentOperator.id === this._id : false
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

    static getItem(props){
        return props.operator;
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
            isDragged: this._isDragged,
            isAvailableForDragging: this._isAvailableForDragging,
            connectorType: this._connectorType,
            invoker: this._invoker,
            entity: this._entity.getObject(),
        };
    }
}