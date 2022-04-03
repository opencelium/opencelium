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

import {useEffect, useState} from 'react';
import {Console} from "./Console";
import {HookStateClass} from "./HookStateClass";
import {useSelector} from "react-redux";
import {capitalize} from "../../utils";
import {AppDispatch, RootState} from "@store/store";
import {DispatchParamsProps, IObservation} from "@interface/application/IApplication";
import {AsyncThunk} from "@reduxjs/toolkit";
import {useAppSelector} from "../../hooks/redux";
import {isString} from "../../components/utils";


export class Application{
    static isDebugging = false;
    static getReduxState(){
        return useAppSelector((state: RootState) => state.applicationReducer);
    }
    static isValidImageUrl(url: string){
        return isString(url) && url !== '' && url.indexOf('/null') === -1;
    }
    static createState<Type extends HookStateClass>(instance: Type, dispatch?: AppDispatch, observations?: IObservation[]): [Type, any]{
        const [entity, setEntity] = useState(instance)
        entity.updateState = (data: any) => {
            this.isDebugging && Console.print(data);
            setEntity(data)
        };
        if(dispatch){
            entity.dispatch = dispatch;
        }
        if(observations && observations.length > 0) {
            for(let i = 0; i < observations.length; i++){
                useEffect(() => {
                    if(observations[i].functionName === 'updateState'){
                        if(observations[i].value) {
                            // @ts-ignore
                            instance.updateWholeInstance && instance.updateWholeInstance(entity, observations[i].value);
                        }
                    } else{
                        // @ts-ignore
                        instance[`update${capitalize(observations[i].functionName)}`](entity, observations[i].value);
                    }
                }, [observations[i].value])
            }
        }
        return [entity, setEntity];
    }

    static createSelector<Type extends HookStateClass>(selectorFunction: any, dispatch: any): Type{
        const selector = useSelector(selectorFunction);
        // @ts-ignore
        selector.dispatch = dispatch;
        // @ts-ignore
        return selector;
    }

    static inputTypeWithDependencies(dependencies: string[]) {
        return function (target: any, propertyKey: string) {
            Application.inputType(target, propertyKey, dependencies);
        }
    }

    static required(target: any, propertyKey: string) {
        if(propertyKey) {
            const descriptor = {
                value: (reference: any, newValue: any) => {
                    const Instance = reference.getClass();
                    let validations = {...reference.validations, ...newValue};
                    const newData = new Instance({...reference, validations});
                    if (typeof reference.updateState === 'function') {
                        reference.updateState(newData);
                    }
                }
            };
            if(typeof target[`${propertyKey}ValidationMessageRequired`] === 'undefined'){
                Object.defineProperty(target, `${propertyKey}ValidationMessageRequired`, descriptor);
            }
        }
    }

    static inputType(target: any, propertyKey: string, dependencies?: string[]) {
        if(propertyKey) {
            const descriptor = {
                value: (reference: any, newValue: any, callback?: any) => {
                    if(callback){
                        callback(reference, newValue);
                    }
                    const Instance = reference.getClass();
                    if(reference[propertyKey] !== newValue){
                        delete reference[propertyKey];
                        reference.validations[propertyKey] = '';
                    }
                    const newData = propertyKey === 'wholeInstance' ? new Instance({...reference, ...newValue}) : new Instance({...reference, [propertyKey]: newValue});
                    if(dependencies){
                        for(let i = 0; i < dependencies.length; i++){
                            newData[dependencies[i]]();
                        }
                    }
                    if (typeof reference.updateState === 'function') {
                        reference.updateState(newData);
                    }
                }
            };
            Object.defineProperty(target, `update${capitalize(propertyKey)}`, descriptor);
        }
    }

    static dispatch<T>(action: AsyncThunk<unknown, unknown, unknown>, params?: DispatchParamsProps<T>){
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function () {
                let reference = this;
                const isValid = params && params.hasNoValidation ? true : reference.validate();
                if(isValid) {
                    if(originalMethod.apply(this, arguments)) {
                        if (typeof reference.dispatch === 'function') {
                            let data = {...reference};
                            if(params && params.mapping){
                                data = params.mapping(reference);
                            }
                            reference.dispatch(action(data));
                        }
                    }
                }
            };
            return descriptor;
        };
    }

}