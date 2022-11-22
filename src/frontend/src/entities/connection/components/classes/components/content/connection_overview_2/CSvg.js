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


export const COLOR_MODE = {
    RECTANGLE_TOP: 'RECTANGLE_TOP',
    BACKGROUND: 'BACKGROUND_COLOR',
    CIRCLE_LEFT_TOP: 'CIRCLE_LEFT_TOP',
};

export default class CSvg{

    static setViewBox(elementId, viewBox = {x: 0, y: 0, width: 0, height: 0}){
        const svgElement = document.getElementById(elementId);
        if(svgElement) {
            if (svgElement.viewBox.baseVal === null) {
                viewBox = {x: 0, y: 0, width: 0, height: 0, ...viewBox};
                svgElement.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
            } else {
                if(viewBox.x && svgElement.viewBox.baseVal.x !== viewBox.x) svgElement.viewBox.baseVal.x = viewBox.x;
                if(viewBox.y && svgElement.viewBox.baseVal.y !== viewBox.y) svgElement.viewBox.baseVal.y = viewBox.y;
                if(viewBox.width && svgElement.viewBox.baseVal.width !== viewBox.width) svgElement.viewBox.baseVal.width = viewBox.width;
                if(viewBox.height && svgElement.viewBox.baseVal.height !== viewBox.height) svgElement.viewBox.baseVal.height = viewBox.height;
            }
        }
    }

    static getMousePosition(event, element){
        const CTM = element.getScreenCTM();
        return {
            x: (event.clientX - CTM.e) / CTM.a,
            y: (event.clientY - CTM.f) / CTM.d
        };
    }

    static resizeSVG(layoutId, svgId){
        const layout = document.getElementById(layoutId);
        if(layout) {
            const width = layout.offsetWidth;
            const height = layout.offsetHeight;
            CSvg.setViewBox(svgId, {width: width + 300, height: height + 300});
        }
    }
}