import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";
import {Step} from "react-joyride";

export default class Equal extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Equal})
    }

    getTourSteps(): Step[] {
        const steps = super.getTourSteps();
        return steps.map(s => ({...s, title: 'Equal'}))
    }
}
