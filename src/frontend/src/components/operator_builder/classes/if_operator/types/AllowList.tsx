import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {ConstantComponentType} from "@app_component/operator_builder/reference_generator/props";

//left side: a string, "guest"
//right side: a list of strings represented as text divided with comma, "quest,user,manager"
export default class AllowList extends IfBaseOperator{

    constructor() {
        super({
            name: BinaryOperatorName.AllowList,
            placeholder: '%item1,item2%,%item3%',
            defaultRefType: 'constant',
            defaultConstantType: ConstantComponentType.Textarea,
        })
    }
}
