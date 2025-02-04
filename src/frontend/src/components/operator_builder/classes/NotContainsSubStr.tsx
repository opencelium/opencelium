import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

export default class NotContainsSubStr extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotContainsSubStr})
    }
}
