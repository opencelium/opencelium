import IfBaseOperator from "../IfBaseOperator";
import {UnaryOperatorName} from "../../../interfaces/OperatorName";

//left side: if anything but not null, then true, otherwise false
export default class IsNotNull extends IfBaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNotNull})
    }
}
