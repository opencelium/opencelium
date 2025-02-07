import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: a string, "guest"
//right side: a list of strings represented as text divided with comma, "admin,user,manager"
export default class DenyList extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.DenyList})
    }
}
