import IfBaseOperator from "../IfBaseOperator";
import {UnaryOperatorName} from "../../../interfaces/OperatorName";

//left side: if an empty array then true, otherwise false
export default class IsEmpty extends IfBaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsEmpty})
    }
}
