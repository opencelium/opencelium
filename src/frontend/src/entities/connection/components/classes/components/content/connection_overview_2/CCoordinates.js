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

import CPosition from "@entity/connection/components/classes/components/content/connection_overview_2/CPosition";
export const ARROW_END_LENGTH = 20;

export const ARROW_MARGIN = 25;

export default class CCoordinates{

    static getXDelta(from, to){
        let result = to.x - (from.x + from.width);
        if(result < 0){
            result = from.x - (to.x + to.width);
        }
        return result;
    }

    static getYDelta(from, to){
        let result = to.y - (from.y + from.height);
        if(result < 0){
            result = from.y - (to.y + to.height);
        }
        return result;
    }

    static getMaxX(from, to){
        return from.x + from.width >= to.x + to.width ? from.x + from.width : to.x + to.width;
    }
    static getMaxY(from, to){
        return from.y >= to.y ? from.y : to.y;
    }

    static getCenter(item){
        return{
            x: item.x + item.width / 2,
            y: item.y + item.height / 2,
        };
    }

    static getTopMiddle(item){
        return{
            x: item.x + item.width / 2,
            y: item.y,
        };
    }
    static getRightMiddle(item){
        return{
            x: item.x + item.width,
            y: item.y + item.height / 2,
        };
    }
    static getBottomMiddle(item){
        return{
            x: item.x + item.width / 2,
            y: item.y + item.height,
        };
    }
    static getLeftMiddle(item){
        return{
            x: item.x,
            y: item.y + item.height / 2,
        };
    }

    static case1Coordinates(from, to){
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemARight = CCoordinates.getRightMiddle(from);
        let elemBLeft = CCoordinates.getLeftMiddle(to);
        arrow.x1 = elemARight.x;
        arrow.y1 = elemARight.y;
        arrow.x2 = elemBLeft.x - ARROW_END_LENGTH;
        arrow.y2 = elemBLeft.y;
        return {arrow};
    }

    static case2Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemATop = CCoordinates.getTopMiddle(from);
        let elemBTop = CCoordinates.getTopMiddle(to);
        line1.x1 = elemATop.x;
        line1.y1 = elemATop.y;
        line1.x2 = elemATop.x;
        line1.y2 = elemATop.y - ARROW_MARGIN - (Math.abs(from.y - to.y));

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = elemBTop.x;
        if(from.x === to.x && from.width === to.width){
            line2.x2 += 10;
        }
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = arrow.y1 + ARROW_MARGIN - ARROW_END_LENGTH;
        return {line1, line2, arrow};
    }

    static case3Coordinates(from, to){
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemALeft = CCoordinates.getLeftMiddle(from);
        let elemBRight = CCoordinates.getRightMiddle(to);
        arrow.x1 = elemALeft.x;
        arrow.y1 = elemALeft.y;
        arrow.x2 = elemBRight.x + ARROW_END_LENGTH;
        arrow.y2 = elemBRight.y;
        return {arrow};
    }

    static case4Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemARight = CCoordinates.getRightMiddle(from);
        let elemBLeft = CCoordinates.getLeftMiddle(to);
        line1.x1 = elemARight.x;
        line1.y1 = elemARight.y;
        line1.x2 = elemARight.x + (CCoordinates.getXDelta(from, to) / 2);
        line1.y2 = elemARight.y;

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = line2.x1;
        line2.y2 = elemBLeft.y;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = elemBLeft.x - ARROW_END_LENGTH;
        arrow.y2 = arrow.y1;
        return {line1, line2, arrow};
    }

    static case5Coordinates(from, to){
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemARight = CCoordinates.getRightMiddle(from);
        let elemBTop = CCoordinates.getTopMiddle(to);

        line2.x1 = elemARight.x;
        line2.y1 = elemARight.y;
        line2.x2 = elemBTop.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBTop.y - ARROW_END_LENGTH;
        return {line2, arrow};
    }

    static case6Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemABottom = CCoordinates.getBottomMiddle(from);
        let elemBTop = CCoordinates.getTopMiddle(to);
        line1.x1 = elemABottom.x;
        line1.y1 = elemABottom.y;
        line1.x2 = line1.x1;
        line1.y2 = elemABottom.y + (CCoordinates.getYDelta(from, to) / 2);

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = elemBTop.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBTop.y - ARROW_END_LENGTH;
        return {line1, line2, arrow};
    }

    static case7Coordinates(from, to){
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemABottom = CCoordinates.getBottomMiddle(from);
        let elemBTop = CCoordinates.getTopMiddle(to);
        arrow.x1 = elemABottom.x;
        arrow.y1 = elemABottom.y;
        arrow.x2 = elemBTop.x;
        arrow.y2 = elemBTop.y - ARROW_END_LENGTH;
        return {arrow};
    }

    static case8Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemARight = CCoordinates.getRightMiddle(from);
        let elemBRight = CCoordinates.getRightMiddle(to);
        line1.x1 = elemARight.x;
        line1.y1 = elemARight.y;
        line1.x2 = elemARight.x + ARROW_MARGIN;
        line1.y2 = elemARight.y;

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = line1.x2;
        line2.y2 = elemBRight.y;
        if(from.y === to.y){
            line2.y2 += 10;
        }

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1 - ARROW_MARGIN + ARROW_END_LENGTH - (Math.abs(from.width - to.width) / 2);
        arrow.y2 = arrow.y1;
        return {line1, line2, arrow};
    }

    static case9Coordinates(from, to){
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemALeft = CCoordinates.getLeftMiddle(from);
        let elemBTop = CCoordinates.getTopMiddle(to);

        line2.x1 = elemALeft.x;
        line2.y1 = elemALeft.y;
        line2.x2 = elemBTop.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBTop.y - ARROW_END_LENGTH;
        return {line2, arrow};
    }

    static case10Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemALeft = CCoordinates.getLeftMiddle(from);
        let elemBRight = CCoordinates.getRightMiddle(to);
        line1.x1 = elemALeft.x;
        line1.y1 = elemALeft.y;
        line1.x2 = elemALeft.x - (CCoordinates.getXDelta(from, to) / 2);
        line1.y2 = elemALeft.y;

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = line2.x1;
        line2.y2 = elemBRight.y;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = elemBRight.x + ARROW_END_LENGTH;
        arrow.y2 = arrow.y1;
        return {line1, line2, arrow};
    }

    static case11Coordinates(from, to){
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemALeft = CCoordinates.getLeftMiddle(from);
        let elemBBottom = CCoordinates.getBottomMiddle(to);

        line2.x1 = elemALeft.x;
        line2.y1 = elemALeft.y;
        line2.x2 = elemBBottom.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBBottom.y + ARROW_END_LENGTH;
        return {line2, arrow};
    }

    static case12Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemATop = CCoordinates.getTopMiddle(from);
        let elemBBottom = CCoordinates.getBottomMiddle(to);
        line1.x1 = elemATop.x;
        line1.y1 = elemATop.y;
        line1.x2 = elemATop.x
        line1.y2 = elemATop.y - (CCoordinates.getYDelta(from, to) / 2);

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = elemBBottom.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBBottom.y + ARROW_END_LENGTH;
        return {line1, line2, arrow};
    }

    static case13Coordinates(from, to){
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemATop = CCoordinates.getTopMiddle(from);
        let elemBBottom = CCoordinates.getBottomMiddle(to);
        arrow.x1 = elemATop.x;
        arrow.y1 = elemATop.y;
        arrow.x2 = elemBBottom.x;
        arrow.y2 = elemBBottom.y + ARROW_END_LENGTH;
        return {arrow};
    }

    static case14Coordinates(from, to){
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemARight = CCoordinates.getRightMiddle(from);
        let elemBBottom = CCoordinates.getBottomMiddle(to);

        line2.x1 = elemARight.x;
        line2.y1 = elemARight.y;
        line2.x2 = elemBBottom.x;
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = elemBBottom.y + ARROW_END_LENGTH;
        return {line2, arrow};
    }

    static case15Coordinates(from, to){
        let line1 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let line2 = {x1: 0, y1: 0, x2: 0, y2: 0};
        let arrow = {x1: 0, y1: 0, x2: 0, y2: 0};
        let elemABottom = CCoordinates.getBottomMiddle(from);
        let elemBBottom = CCoordinates.getBottomMiddle(to);
        line1.x1 = elemABottom.x;
        line1.y1 = elemABottom.y;
        line1.x2 = elemABottom.x;
        line1.y2 = elemABottom.y + ARROW_MARGIN + (Math.abs(from.y - to.y)) - (Math.abs(from.height - to.height));

        line2.x1 = line1.x2;
        line2.y1 = line1.y2;
        line2.x2 = elemBBottom.x;
        if(from.x === to.x && from.width === to.width){
            line2.x2 += 10;
        }
        line2.y2 = line2.y1;

        arrow.x1 = line2.x2;
        arrow.y1 = line2.y2;
        arrow.x2 = arrow.x1;
        arrow.y2 = arrow.y1 - ARROW_MARGIN + ARROW_END_LENGTH;
        return {line1, line2, arrow};
    }

    static getLinkCoordinates(from, to){
        let line1 = null;
        let line2 = null;
        let arrow = null;
        let iterator = 1;
        let result = {line1, line2, arrow};
        while(true){
            if(CPosition.hasOwnProperty(`isCase${iterator}`)){
                if(CPosition[`isCase${iterator}`](from, to)){
                    if(CCoordinates.hasOwnProperty(`case${iterator}Coordinates`)){
                        result = {...result, ...CCoordinates[`case${iterator}Coordinates`](from ,to)}
                    }
                    break;
                }
            } else{
                break;
            }
            iterator++;
        }
        return result;
    }
}