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

import CMethodItem from "@classes/components/content/connection/method/CMethodItem";

export const PROCESS_HEIGHT = 80;

export const PROCESS_WIDTH = 130;

export const PROCESS_LABEL_PADDING = 10;

export default class CProcess{

    constructor(process) {
        this._id = process && process.hasOwnProperty('id') ? process.id : '';
        this._name = process && process.hasOwnProperty('name') ? process.name : '';
        this._x = process && process.hasOwnProperty('x') ? process.x : 0;
        this._y = process && process.hasOwnProperty('y') ? process.y : 0;
        this._width = PROCESS_WIDTH;
        this._height = PROCESS_HEIGHT;
        this._connector = process && process.hasOwnProperty('connector') ? process.connector : null;
        this._invoker = process && process.hasOwnProperty('invoker') ? process.invoker : null;
        this._entity = process && process.hasOwnProperty('entity') ? process.entity : null;
        if(!(this._entity instanceof CMethodItem)){
            this._entity = CMethodItem.createMethodItem(this._entity);
        }
    }

    get id(){
        return this._id;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
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

    setProcessWidth(processText) {
        this._width = Math.ceil((processText.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10;
    }

    getObject(){
        return {
            id: this._id,
            name: this._name,
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            connector: this._connector,
            invoker: this._invoker,
            entity: this._entity.getObjectForSvgElement(),
        };
    }
}