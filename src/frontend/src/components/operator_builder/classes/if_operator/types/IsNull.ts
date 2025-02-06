import IfBaseOperator from "../IfBaseOperator";
import {UnaryOperatorName} from "../../../interfaces/OperatorName";

//left side: if null then true, otherweise false
export default class IsNull extends IfBaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNull})
    }
}
