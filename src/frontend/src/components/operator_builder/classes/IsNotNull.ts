import BaseOperator from "./BaseOperator";
import {UnaryOperatorName} from "../interfaces/OperatorName";

//left side: if anything but not null, then true, otherwise false
export default class IsNotNull extends BaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNotNull})
    }
}
