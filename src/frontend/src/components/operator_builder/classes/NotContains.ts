import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

export default class NotContains extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotContains})
    }
}
