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

import {ITheme} from "../../general/Theme";
import {MultipleTitleProps} from "@interface/application/IListCollection";
import React from "react";

interface TitleStyledProps{

}

interface ActionsStyledProps{

}

interface FormStyledProps{
    margin?: string | number,
    padding?: string | number,
}

interface FormSectionStyledProps{
    additionalStyles?: string,
}

interface FormProps{
    theme?: ITheme,
    title?: string | MultipleTitleProps[] | React.ReactNode,
    formSections?: any,
    actions?: any[],
    isLoading?: boolean,
    error?: any,
}

export {
    TitleStyledProps,
    ActionsStyledProps,
    FormStyledProps,
    FormSectionStyledProps,
    FormProps,
}