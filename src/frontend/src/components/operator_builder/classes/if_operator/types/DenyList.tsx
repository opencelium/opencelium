import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {ConstantComponentType} from "@app_component/operator_builder/reference_generator/props";

//left side: a string, "guest"
//right side: a list of strings represented as text divided with comma, "admin,user,manager"
export default class DenyList extends IfBaseOperator{

    constructor() {
        super({
            name: BinaryOperatorName.DenyList,
            placeholder: '%item1,item2%,%item3%',
            defaultRefType: 'constant',
            defaultConstantType: ConstantComponentType.Textarea,
        })
    }
}
