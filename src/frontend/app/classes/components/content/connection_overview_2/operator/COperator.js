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

export const IF_OPERATOR_SIZE = 60;

export default class COperator{

    constructor(operator) {
        this._id = operator && operator.hasOwnProperty('id') ? operator.id : '';
        this._type = operator && operator.hasOwnProperty('type') ? operator.type : '';
        this._label = operator && operator.hasOwnProperty('label') ? operator.label : '';
        this._x = operator && operator.hasOwnProperty('x') ? operator.x : 0;
        this._y = operator && operator.hasOwnProperty('y') ? operator.y : 0;
        this._width = IF_OPERATOR_SIZE;
        this._height = IF_OPERATOR_SIZE;
        this._connector = operator && operator.hasOwnProperty('connector') ? operator.connector : null;
        this._invoker = operator && operator.hasOwnProperty('invoker') ? operator.invoker : null;
        this._entity = operator && operator.hasOwnProperty('entity') ? operator.entity : null;
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
            entity: this._entity,
        };
    }
}