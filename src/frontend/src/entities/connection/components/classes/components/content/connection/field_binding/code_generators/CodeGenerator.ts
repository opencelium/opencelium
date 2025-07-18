import {transformDataFields} from "@change_component/form_elements/form_connection/form_svg/utils";

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
                result.name = `_to_connector_${result.name}`;
            }
        }

        return result;
    }

}
