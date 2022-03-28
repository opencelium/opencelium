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
import getResources from "@decorators/getResources";


//@getResources(['invokers', 'connectors'], {isBackground: true})
class Resources extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        var htmlString = `<div style=\\"font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;\\">\\n<div><br></div>\\n<div> Attachement inline von FD zu Zammd:</div>\\n<div></div>\\n<div><img src=\\"https://eucattachment.freshservice.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MjYwMjUwNTQ1MDYsImRvbWFpbiI6ImF0b3RlY2guZnJlc2hzZXJ2aWNlLmNvbSIsInR5cGUiOjF9.tRbg9V_vG0iZMoOy3740TOrLvqKpTwjPnscGscqS364\\" class=\\"inline-image\\" data-id=\\"26025054506\\" data-store-type=\\"1\\"></div>\\n<br><div></div>\\n<img src="http://image"/></div>`;
        var elem = document.createElement('div');
        elem.innerHTML = htmlString;
        var imgs = elem.querySelectorAll('img');
        var aTags = [];
        for(let i = 0; i < imgs.length; i++){
            let aTag = document.createElement('a');
            aTag.setAttribute('href', imgs[i].getAttribute('src'));
            aTag.innerHTML = 'image';
            aTags.push(aTag);
            imgs[i].replaceWith(aTag);
        }

        var splitHtmlByImg = htmlString.split('<img');
        var result = '';
        if(splitHtmlByImg.length > 0) {
            if(htmlString.indexOf('<img') !== 0){
                result += splitHtmlByImg[0];
            }
            for (let i = 1; i < splitHtmlByImg.length; i++) {
                let aTag = '<a href="{src}">image</a>';
                let endImgTagIndex = splitHtmlByImg[i].indexOf('/>');
                let imgTag = splitHtmlByImg[i].substring(0, endImgTagIndex).replaceAll(' ', '');
                let startSrcIndex = imgTag.indexOf('src="');
                let srcLength = imgTag.substr(startSrcIndex).indexOf('"');
                let src = imgTag.substr(startSrcIndex, srcLength);
                result += (aTag.replace('{src}', src) + splitHtmlByImg[i].substr(endImgTagIndex));
            }
        }
        console.log(result);
        return null;
    }
}

export default Resources;