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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {isArray} from "@application/utils/utils";
import Text from "@app_component/base/text/Text";
import {TitleProps} from './interfaces';
import {IconStyled, LinkStyled, TitleStyled} from "./styles";
import {Application} from "@application/classes/Application";
import DashboardIcon from "@app_component/layout/top_bar/collection_title/icons/DashboardIcon";
import {EntityHeaderTextSize} from "@entity/application/utils/constants";

const Title: FC<TitleProps> =
    ({
        title,
        className,
    }) => {
    const {
        entityIconKey,
    } = Application.getReduxState();
    let icon = null;
    switch (entityIconKey) {
        case 'dashboard':
            icon = <DashboardIcon/>
            break;
    }
    if(isArray(title)){
        return(
            <TitleStyled className={className}>
                <span>
                    {
                        // @ts-ignore
                        title.map((t, index) => {
                            // @ts-ignore
                            let isLastTitle = index === title.length - 1;
                            if(t.link){
                                return (
                                    <span key={t.name}>
                                        <LinkStyled to={t.link} title={t.name}><Text value={`${t.name}`} size={`${EntityHeaderTextSize}px`}/></LinkStyled>
                                        <Text value={`${!isLastTitle ? ` / ` : ''}`} size={`${EntityHeaderTextSize}px`}/>
                                    </span>
                                );
                            } else{
                                return <span key={t.name}><Text value={`${t.name}${!isLastTitle ? ` / ` : ''}`} size={`${EntityHeaderTextSize}px`}/></span>;
                            }
                        })
                    }
                    <IconStyled>{icon}</IconStyled>
                </span>
            </TitleStyled>
        )
    }
    return (
        <TitleStyled className={className}>
            <span>
                <Text value={title} size={`${EntityHeaderTextSize}px`}/>
                <IconStyled>{icon}</IconStyled>
            </span>
        </TitleStyled>
    );
}

Title.defaultProps = {
    className: '',
}


export {
    Title,
};

export default withTheme(Title);
