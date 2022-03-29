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