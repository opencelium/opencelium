import { ICodeGenerator } from './ICodeGenerator';
import {transformExpertVar} from "@change_component/form_elements/form_connection/form_svg/utils";
import CodeGenerator from "@classes/content/connection/field_binding/code_generators/CodeGenerator";

export class PythonCodeGenerator extends CodeGenerator implements ICodeGenerator {
    constructor(fieldBinding: any) {
        super(fieldBinding);
    }

    getDefaultExpertCode(): string {
        return `RESULT_VAR = VAR_0`;
    }

    getExpertVarRegExp(): RegExp {
        return /(\w+)\s*=\s*#(\w+)\.\(\w+\)\.([\w\d.\[\*\]\~]+)/g;
    }

    getExpertVar(): string {
        let result = '';
        if (this._fieldBinding) {
            let resultVariable = this.getResultVariable();
            let variables = this.getVariables();

            let resultFrom = this._fieldBinding.to.some((item: any) =>
                item.field.startsWith('header.$')
            )
                ? 'header'
                : 'body';

            result += `//RESULT_VAR = ${resultVariable.color}.(${
                resultVariable.type
            }).${transformExpertVar(resultVariable.name, resultFrom)}\n`;

            for (let i = 0; i < variables.length; i++) {
                result += `//VAR_${i} = ${variables[i].color}.(${
                    variables[i].type
                }).${transformExpertVar(variables[i].name, 'body')}`;
                if (i < variables.length - 1) result += '\n';
            }
        }
        return result;
    }
}
