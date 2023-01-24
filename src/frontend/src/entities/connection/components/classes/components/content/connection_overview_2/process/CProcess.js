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
        this._isDragged = process && process.hasOwnProperty('isDragged') ? process.isDragged : false;
        this._isDraggedForCopy = process && process.hasOwnProperty('isDraggedForCopy') ? process.isDraggedForCopy : false;
        this._isAvailableForDragging = process && process.hasOwnProperty('isAvailableForDragging') ? process.isAvailableForDragging : false;
        this._isSelectedAll = process && process.hasOwnProperty('isSelectedAll') ? process.isSelectedAll : false;
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id = id;
    }

    getHtmlIdName(){
        return `${this._id}__${this._name}`
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

    get isDragged(){
        return this._isDragged;
    }

    set isDragged(isDragged){
        this._isDragged = isDragged;
    }

    get isDraggedForCopy(){
        return this._isDraggedForCopy;
    }

    set isDraggedForCopy(isDraggedForCopy){
        this._isDraggedForCopy = isDraggedForCopy;
    }

    get isAvailableForDragging(){
        return this._isAvailableForDragging;
    }

    set isAvailableForDragging(isAvailableForDragging){
        this._isAvailableForDragging = isAvailableForDragging;
    }

    get isSelectedAll(){
        return this._isSelectedAll;
    }

    set isSelectedAll(isSelectedAll){
        this._isSelectedAll = isSelectedAll;
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

    isHighlighted(currentItem){
        return currentItem ? `${this._id}`.indexOf(currentItem.id) === 0 || currentItem.isSelectedAll && this.isAfter(currentItem) : false;
    }

    isAfter(currentItem){
        if(!currentItem) return false;
        let indexes = currentItem.id.split('_');
        indexes.pop();
        let rootIndex = indexes.join('_');
        return this._id > currentItem.id && this._id.substring(0, rootIndex.length) === rootIndex;
    }

    isCurrent(currentProcess){
        return currentProcess ? currentProcess.id === this._id : false
    }

    setProcessWidth(processText) {
        this._width = Math.ceil((processText.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10;
    }

    static getItem(props){
        return props.process;
    }

    getObject(){
        return {
            id: this._id,
            name: this._name,
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            isDragged: this._isDragged,
            isDraggedForCopy: this._isDraggedForCopy,
            isAvailableForDragging: this._isAvailableForDragging,
            isSelectedAll: this._isSelectedAll,
        };
    }

    getObjectForBackend(){
        return {
            id: this._id,
            name: this._name,
            x: this._x,
            y: this._y,
        };
    }
}