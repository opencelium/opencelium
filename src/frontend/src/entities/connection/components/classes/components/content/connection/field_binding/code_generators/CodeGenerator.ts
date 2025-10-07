import {transformDataFields, transformExpertVar} from "@change_component/form_elements/form_connection/form_svg/utils";

export default class CodeGenerator {
    _fieldBinding: any;

    constructor(fieldBinding: any) {
        this._fieldBinding = fieldBinding;
    }


    protected getVariables(): {name: string, value: any, type: string, color: string}[] {
        const binding = this._fieldBinding;
        let variables = [];
        for (let i = 0; i < binding.from.length; i++) {
            const fromFieldName = transformDataFields(binding.from[i].field);
            variables.push({
                name: fromFieldName,
                value: null,
                type: binding.from[i].type,
                color: binding.from[i].color,
            });
        }
        return variables;
    }

    protected getResultVariable() {
        const binding = this._fieldBinding;
        let variables = this.getVariables();
        let result: any = { name: '', value: null, type: 'variable' };

        if (binding.to.length > 0) {
            let toFieldName = transformDataFields(binding.to[0].field);
            let toFieldType = binding.to[0].type;
            let toFieldColor = binding.to[0].color;

            if (toFieldName !== '') {
                result = {
                    name: toFieldName,
                    value: null,
                    type: toFieldType,
                    color: toFieldColor,
                };
            }
            if (variables.findIndex((v) => v.name === result.name) !== -1) {
                //result.name = `_to_connector_${result.name}`;
            }
        }

        return result;
    }

    protected getExpertVarRegExp(): RegExp {
        return /var\s+(\w+)\s*=\s*#(\w+)\.\(\w+\)\.([^;]+)\s*;/g;
    }

    protected getExpertVar(): string {
        let result = '';
        if (this._fieldBinding) {
            let resultVariable = this.getResultVariable();
            let variables = this.getVariables();

            let resultFrom = this._fieldBinding.to.some((item: any) =>
                item.field.startsWith('header.$')
            )
                ? 'header'
                : 'body';

            result += `//var RESULT_VAR = ${resultVariable.color}.(${
                resultVariable.type
            }).${transformExpertVar(resultVariable.name, resultFrom)};\n`;

            for (let i = 0; i < variables.length; i++) {
                result += `//var VAR_${i} = ${variables[i].color}.(${
                    variables[i].type
                }).${transformExpertVar(variables[i].name, 'body')};`;
                if (i < variables.length - 1) result += '\n';
            }
        }
        return result;
    }

}
