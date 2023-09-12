import ModelDataAggregator, {ModelArgument, ModelAssignedItem} from "@entity/data_aggregator/requests/models/DataAggregator";
import {subArrayToString} from "@application/utils/utils";

export default class CAggregator implements ModelDataAggregator{
    public id: string;
    public name: string;
    public assignedItems: ModelAssignedItem[];
    public args: ModelArgument[];
    public script: string;

    constructor(id: string = '', name: string = '', assignedItems: ModelAssignedItem[] = [], args: ModelArgument[] = [], script: string = '') {
        if(id){
            this.id = id;
        }
        this.name = name;
        this.assignedItems = assignedItems;
        this.args = args;
        this.script = script;
    }

    static createAggregator(aggregatorData: ModelDataAggregator){
        const id = aggregatorData && aggregatorData.hasOwnProperty('id') ? aggregatorData.id : '';
        const name = aggregatorData && aggregatorData.hasOwnProperty('name') ? aggregatorData.name : '';
        const assignedItems = aggregatorData && aggregatorData.hasOwnProperty('assignedItems') ? aggregatorData.assignedItems : [];
        const args = aggregatorData && aggregatorData.hasOwnProperty('args') ? aggregatorData.args : [];
        const script = aggregatorData && aggregatorData.hasOwnProperty('script') ? aggregatorData.script : '';
        return new CAggregator(id, name, assignedItems, args, script);
    }

    addItem(item: ModelAssignedItem){
        this.assignedItems.push(item);
    }

    deleteItem(assignedItem: ModelAssignedItem){
        this.assignedItems = this.assignedItems.filter(item => item.name !== assignedItem.name);
    }

    addArgument(argument: ModelArgument){
        this.args.push(argument);
    }

    updateArgument(argument: ModelArgument){
        this.args = this.args.map(arg => arg.name === argument.name ? argument : arg);
    }

    deleteArgument(argument: ModelArgument){
        this.args = this.args.filter(arg => arg.name !== argument.name);
    }

    getObject(): ModelDataAggregator{
        let obj: ModelDataAggregator;
        if(this.id){
            obj.id = this.id;
        }
        return {
            ...obj,
            name: this.name,
            args: this.args,
            assignedItems: this.assignedItems,
            script: this.script,
        }
    }

    static generateNotExistVar(){
        return `OC_ARG_NOT_EXIST`;
    }

    static getVariablesComment(): string{
        return `/* \n\tHere are variables that came from arguments and can be used\n\tin the script. All responses of the method are stored in Responses \n\tvariable. 
\t\tThe response has next structure: 
\t\tsuccess - for success response
\t\t\theader - header data of the success
\t\t\tpayload - response data of the success
\t\tfail - for fail response
\t\t\theader - header data of the fail
\t\t\tpayload - response data of the fail \n*/\n`;
    }

    static getScriptSegmentComment(): string{
        return `/* \n\tPlease, define the initial value for your variables.
\tIn this section you can define a logic of your script. \n*/\n`;
    }

    static splitVariablesFromScript(script: string): {variables: string, scriptSegment: string}{
        let scriptSplit = script ? script.split('\n\n') : [];
        if(scriptSplit.length === 0){
            return {variables: this.getVariablesComment(), scriptSegment: ''};
        }
        return {
            variables: `${this.getVariablesComment()}${scriptSplit[0]}`,
            scriptSegment: subArrayToString(scriptSplit, '\n\n', 1, scriptSplit.length),
        }
    }

    static joinVariablesWithScriptSegment(variables: string, scriptSegment: string): string {
        return this.cleanCodeFromComments(`${variables}\n\n${scriptSegment}`);
    }

    static cleanCodeFromComments(code: string): string{
        return code.replace(/\s*\/\/.*\n/g, '\n').replace(/\s*\/\*[\s\S]*?\*\//g, '').trim();
    }

}
