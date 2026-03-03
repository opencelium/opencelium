import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {Step} from "react-joyride";

export default class GreaterThan extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.GreaterThan})
    }

    getTourSteps(): Step[] {
        const steps = super.getTourSteps();
        return steps.map(s => ({...s, title: 'Greater Than'}))
    }
}
