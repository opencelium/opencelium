import BaseOperator from "./BaseOperator";
import {UnaryOperatorName} from "../interfaces/OperatorName";

//left side: if an empty array then true, otherwise false
export default class IsEmpty extends BaseOperator{

    constructor() {
        super({name: UnaryOperatorName.IsEmpty})
    }
}
