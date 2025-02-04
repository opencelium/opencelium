import BaseOperator from "./BaseOperator";
import {UnaryOperatorName} from "../interfaces/OperatorName";

//left side: if not an empty array then true, otherwise false
export default class IsNotEmpty extends BaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsNotEmpty})
    }
}
