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

import {useEffect, useState} from 'react';
import {Console} from "./Console";
import {HookStateClass} from "./HookStateClass";
import {capitalize, isString} from "../utils/utils";
import {AppDispatch, RootState, useAppSelector} from "../utils/store";
import {DispatchParamsProps, IObservation} from "../interfaces/IApplication";
import {AsyncThunk} from "@reduxjs/toolkit";
import {baseUrl} from "@entity/application/requests/classes/url";

// Application class for managing core internal operations
export class Application{

    // turn on/off debugging mode
    static isDebugging = false;

    // check if url is not part of opencelium
    static isExternalUrl(url: string){
        return url.indexOf(baseUrl) === 0;
    }

    // check if image's url has valid format
    static isValidImageUrl(url: string){
        return isString(url) && url !== '' && url.indexOf('/null') === -1;
    }

    // returns redux state of Application
    static getReduxState(){
        return useAppSelector((state: RootState) => state.applicationReducer);
    }

    /*
    * TODO: remove dispatch property and test all forms
    */
    /**
     * create react state basing on inputType annotation
     * @param instance - class which used to be stated
     * @param dispatch - set application dispatcher (probably should be removed)
     * @param observations - array of dependencies to refresh the state
     */
    static createState<Type extends HookStateClass>(instance: Type, dispatch?: AppDispatch, observations?: IObservation[]): [Type, any]{
        const [entity, setEntity] = useState(instance)
        entity.updateState = (data: any) => {
            Console.print(data);
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

    // update inputTyped child's property via dependencies
    static inputTypeWithDependencies(dependencies: string[]) {
        return function (target: any, propertyKey: string) {
            Application.inputType(target, propertyKey, dependencies);
        }
    }

    // annotation to child's property to assign it as a react state
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

    /**
     * annotation to dispatch (redux) the child's method
     * @param action - action for dispatching
     * @param params - read DispatchParamsProps comments
     */
    static dispatch<T>(action: AsyncThunk<unknown, unknown, unknown>, params?: DispatchParamsProps<T>){
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function () {
                let reference = this;
                if(this) {
                    const isValid = params && params.hasNoValidation ? true : reference.validate();
                    if (isValid) {
                        if (originalMethod.apply(this, arguments)) {
                            if (typeof reference.dispatch === 'function') {
                                let data = {...reference};
                                if (params && params.mapping) {
                                    data = params.mapping(reference);
                                }
                                reference.dispatch(action(data));
                            }
                        }
                    }
                } else {
                    //form.action.handleClick should be called like this: () => classInstance.method()
                }
            };
            return descriptor;
        };
    }

}
