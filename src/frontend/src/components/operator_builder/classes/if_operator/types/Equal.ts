import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class Equal extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Equal})
    }
}
