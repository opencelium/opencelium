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

import {useAppSelector} from "@application/utils/store";
import {RootState} from "@application/utils/store";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

export class CDataAggregator{
    static getReduxState() {
        return useAppSelector((state: RootState) => state.dataAggregatorReducer);
    }

    static getOptionsForSelect(dataAggregator: ModelDataAggregator[]){
        return dataAggregator.map(o => {return {label: o.name, value: o.id};});
    }

    static replaceIdsOnNames(dataAggregator: ModelDataAggregator[], string: string){
        for(let i = 0; i < dataAggregator.length; i++){
            for(let j = 0; j < dataAggregator[i].args.length; j++){
                let splitStr = string.split(this.embraceArgument(dataAggregator[i].args[j].id));
                string = splitStr.join(this.embraceArgument(`${dataAggregator[i].name}.${dataAggregator[i].args[j].name}`));
            }
        }
        return string;
    }

    static replaceNamesOnIds(dataAggregator: ModelDataAggregator[], string: string){
        for(let i = 0; i < dataAggregator.length; i++){
            for(let j = 0; j < dataAggregator[i].args.length; j++){
                let splitStr = string.split(this.embraceArgument(`${dataAggregator[i].name}.${dataAggregator[i].args[j].name}`));
                string = splitStr.join(this.embraceArgument(dataAggregator[i].args[j].id));
            }
        }
        return string;
    }

    static embraceArgument(argument: string){
        return `{{${argument}}}`;
    }
}
