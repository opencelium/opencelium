import LoopBaseOperator from "../LoopBaseOperator";
import {LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";

export default class For extends LoopBaseOperator{

    constructor() {
        super({name: LoopOperatorName.For})
    }
}
