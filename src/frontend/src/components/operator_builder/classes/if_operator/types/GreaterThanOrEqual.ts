import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {Step} from "react-joyride";

export default class GreaterThanOrEqualTo extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.GreaterThanOrEqualTo})
    }

    getTourSteps(): Step[] {
        const steps = super.getTourSteps();
        return steps.map(s => ({...s, title: 'Greater Than or Equal'}))
    }
}
