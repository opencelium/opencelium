import IfBaseOperator from "../IfBaseOperator";
import {UnaryOperatorName} from "../../../interfaces/OperatorName";

//left side: if not an empty array then true, otherwise false
export default class IsNotEmpty extends IfBaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNotEmpty})
    }
}
