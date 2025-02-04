import BaseOperator from "./BaseOperator";
import {UnaryOperatorName} from "../interfaces/OperatorName";

//left side: if null then true, otherweise false
export default class IsNull extends BaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNull})
    }
}
