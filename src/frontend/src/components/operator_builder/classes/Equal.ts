import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

export default class Equal extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Equal})
    }
}
