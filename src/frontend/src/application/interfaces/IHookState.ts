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

import {ReactElement} from "react";
import {IInput} from "./core";

export interface IHookState{

    /**
     * check for focusing during the validation
     */
    isFocused: boolean;

    /**
     * validation messages
     */
    validations: any;

    /**
     * parameter to update the whole instance after API fetching
     */
    wholeInstance: any;

    /**
     * to create a state for react func component
     */
    createState?(): any;

    /**
     * to render input component of type text (InputTextType)
     */
    getInputText?<T, K>(data: IInput<T, K>):ReactElement;

    /**
     * to get update function name to update property via component state
     */
    getFunctionName?(name: string): string;

    /**
     * to update react hook state
     * @param instance
     */
    update?(instance: any): void;
    /**
     * to get class for assigning object in update
     */
    getClass(): any;

    /**
     * to check if id is 0 (not set)
     * @param id = id of the entity
     */
    validateId(id: number): boolean;

    /**
     * owner of the class where it is assigned
     * example:
     * class User{userGroup;}
     * class UserGroup{
     *     owner: User instance;
     * }
     */
    owner?: any;
}