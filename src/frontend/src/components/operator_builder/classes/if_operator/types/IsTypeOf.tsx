import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {ConstantComponentType} from "@app_component/operator_builder/reference_generator/props";

//left side: anything
//right side: string, "Integer" | "Double"
export default class IsTypeOf extends IfBaseOperator{

    constructor() {
        super({
            name: BinaryOperatorName.IsTypeOf,
            defaultRefType: 'constant',
            defaultConstantType: ConstantComponentType.Select,
            selectOptions: [{value: 'NUM', label: 'Number'}, {value: 'ARR', label: 'Array'}, {value: 'OBJ', label: 'Object'}, {value: 'STR', label: 'String'}, {value: 'BOOL', label: 'Boolean'}]
        })
    }
}
