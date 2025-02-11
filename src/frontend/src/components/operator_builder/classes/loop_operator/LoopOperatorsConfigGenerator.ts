import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import For from "@app_component/operator_builder/classes/loop_operator/types/For";
import ForIn from "@app_component/operator_builder/classes/loop_operator/types/ForIn";
import SplitString from "@app_component/operator_builder/classes/loop_operator/types/SplitString";

export default class LoopOperatorsConfigGenerator {

    constructor() {
    }
    getOption(operatorName: LoopOperatorName): OptionType {
        switch (operatorName) {
            case LoopOperatorName.For:
                return (new For()).getOption();
            case LoopOperatorName.ForIn:
                return (new ForIn()).getOption();
            case LoopOperatorName.SplitString:
                return (new SplitString()).getOption();
        }
    }

    getOptions(operatorNames: LoopOperatorName[]): OptionType[] {
        let result: OptionType[] = [];
        for(let i = 0; i < operatorNames.length; i++) {
            result.push(this.getOption(operatorNames[i]));
        }
        return result;
    }

    getAllOptions(): OptionType[] {
        return this.getOptions(Object.values(LoopOperatorName));
    }
}
