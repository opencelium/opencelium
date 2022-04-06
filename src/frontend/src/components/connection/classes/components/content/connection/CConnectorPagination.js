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

import CConnectorItem from "./CConnectorItem";
import {isNumber, sortByIndex} from "@utils/app";

export const DEFAULT_PAGE_LIMIT = 5;
/**
 * ConnectorPagination class for displaying methods and operators
 * separated by pages
 * pagination starts from 0 (not from 1)
 */
export default class CConnectorPagination{

    constructor(connector){
        this._connector = connector ? connector : CConnectorItem.createConnectorItem();
        this._allItems = [];
        this._pageAmount = 1;
        this._currentItems = [];
        this._closurePreviousItems = [];
        this._closureNextItems = [];
        this._currentPageNumber = 0;
        this._limit = DEFAULT_PAGE_LIMIT;
        this._allItems = this.setAllItems();
        this._pageAmount = this.calculatePageAmount();
        this.setCurrentItems();
        this._animationDirection = '';
        this._isAnimating = false;
    }

    load(settings = {}){
        this._allItems = this.setAllItems();
        this._pageAmount = this.calculatePageAmount();
        this.updateCurrentPageNumber();
        this.setCurrentItems();
        if(settings.hasOwnProperty('newItem')){
            if(this._currentItems.findIndex(item => item.index === settings.newItem.index) === -1){
                this.setCurrentPageNumber(this._currentPageNumber + 1);
            }
        }
    }

    static createConnectorPagination(connector){
        return new CConnectorPagination(connector);
    }

    updateCurrentPageNumber(){
        let firstItemPointer = this._allItems.length > 0 ? this._allItems[0] : null;
        const oldCurrentPageNumber = this._currentPageNumber;
        if(this._pageAmount > 1){
            let index = this._currentPageNumber * this._limit;
            if(index < this._allItems.length) {
                firstItemPointer = this._allItems[index];
            }
        }
        if(firstItemPointer && this.currentItems.length > 0) {
            if (firstItemPointer.index !== this._currentItems[0].index){
                let index = this._allItems.findIndex(item => item === this.currentItems[0].index);
                if(index !== -1){
                    this._currentPageNumber = parseInt(index / this._limit);
                }
            }
        }
        if(oldCurrentPageNumber === this._currentPageNumber){
            const currentItem = this._connector.getCurrentItem();
            if(currentItem) {
                if (this._currentItems.findIndex(item => item.index === currentItem.index) === -1) {
                    let index = this._allItems.findIndex(item => item.index === currentItem.index);
                    if (index !== -1) {
                        this._currentPageNumber = parseInt(index / this._limit);
                    }
                }
            }
        }
    }

    setAllItems(){
        let allItems = [];
        for(let i = 0; i < this._connector.methods.length; i++){
            if(!this._connector.methods[i].isToggled) {
                allItems.push(this._connector.methods[i]);
            }
        }
        for(let i = 0; i < this._connector.operators.length; i++){
            if(!this._connector.operators[i].isToggled) {
                allItems.push(this._connector.operators[i]);
            }
        }
        if(allItems.length > 1){
            allItems = sortByIndex(allItems);
        }
        //allItems = this.setIntendForItems(allItems);
        return allItems;
    }

    calculatePageAmount(){
        let pageAmount = 1;
        if(this._allItems.length > this._limit){
            pageAmount = Math.ceil(this._allItems.length / this._limit);
        }
        return parseInt(pageAmount);
    }

    setCurrentItems(){
        let items = [];
        let firstItemPointer = this._allItems.length > 0 ? this._allItems[0] : null;
        if(this._pageAmount > 1){
            let index = 0;
            while(true){
                index = this._currentPageNumber * this._limit;
                if(index === 0 || index < this._allItems.length) {
                    firstItemPointer = this._allItems[index];
                    break;
                } else{
                    this._currentPageNumber--;
                }
            }
        }
        let startPushing = false;
        for(let i = 0; i < this._allItems.length; i++){
            if(startPushing){
                items.push(this._allItems[i]);
                if(items.length === this._limit){
                    startPushing = false;
                }
            }
            if(this._allItems[i].index === firstItemPointer.index){
                startPushing = true;
                items.push(this._allItems[i]);
            }
        }
        this._currentItems = this.setIntendForItems(items);
        let closurePrevItems = [];
        if(this._currentItems.length > 0){
            let index = this._allItems.findIndex(item => item.index === this._currentItems[0].index);
            if(index !== -1){
                for(let i = 0; i < DEFAULT_PAGE_LIMIT; i++){
                    let prevIndex = index - DEFAULT_PAGE_LIMIT + i;
                    if(prevIndex >= 0) {
                        closurePrevItems.push(this._allItems[prevIndex])
                    }
                }
            }
        }
        closurePrevItems = this.setIntendForItems(closurePrevItems);
        this._closurePreviousItems = closurePrevItems.length > 0 ? [...closurePrevItems, ...this._currentItems] : [];
        let closureNextItems = [];
        if(this._currentItems.length > 0){
            let index = this._allItems.findIndex(item => item.index === this._currentItems[this._currentItems.length - 1].index);
            if(index !== -1){
                for(let i = 0; i < DEFAULT_PAGE_LIMIT; i++){
                    let nextIndex = index + 1 + i;
                    if(nextIndex < this._allItems.length) {
                        closureNextItems.push(this._allItems[nextIndex])
                    }
                }
            }
        }
        closureNextItems = this.setIntendForItems(closureNextItems);
        this._closureNextItems = closureNextItems.length > 0 ? [...this._currentItems, ...closureNextItems] : [];
    }

    setIntendForItems(items){
        let minIndexLength = -1;
        for(let i = 0; i < items.length; i++){
            let indexLength = items[i].index.split('_').length;
            if(minIndexLength === -1 || minIndexLength > indexLength){
                minIndexLength = indexLength;
            }
        }
        if(minIndexLength !== -1){
            for(let i = 0; i < items.length; i++){
                let indexLength = items[i].index.split('_').length;
                items[i].intend = indexLength - minIndexLength;
            }
        }
        return items;
    }

    setCurrentPageNumber(number){
        if(isNumber(number) && number < this._pageAmount && number >= 0){
            this._currentPageNumber = parseInt(number);
            this.setCurrentItems();
            let currentItem = this._connector.methods.find(m => m.index === this._currentItems[0].index);
            if(!currentItem){
                currentItem = this._connector.operators.find(o => o.index === this._currentItems[0].index);
            }
            this._connector.setCurrentItem(currentItem);
        }
    }

    reload(connector, settings = {}){
        this._connector = connector ? connector : this._connector;
        this.load(settings);
    }

    get pageAmount(){
        return this._pageAmount;
    }

    get currentPageNumber(){
        return this._currentPageNumber;
    }

    get currentItems(){
        return this._currentItems;
    }

    get allItems(){
        return this._allItems;
    }

    get closurePreviousItems(){
        return this._closurePreviousItems;
    }

    get closureNextItems(){
        return this._closureNextItems;
    }

    get animationDirection(){
        return this._animationDirection;
    }

    set animationDirection(animationDirection){
        this._animationDirection = animationDirection;
    }

    get isAnimating(){
        return this._isAnimating;
    }

    set isAnimating(isAnimating){
        this._isAnimating = isAnimating;
    }
}