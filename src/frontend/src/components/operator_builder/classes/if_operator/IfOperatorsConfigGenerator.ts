import IsEmpty from "./types/IsEmpty";
import IsNotEmpty from "./types/IsNotEmpty";
import IsNull from "./types/IsNull";
import IsNotNull from "./types/IsNotNull";
import Contains from "./types/Contains";
import NotContains from "./types/NotContains";
import Equal from "./types/Equal";
import ContainsSubStr from "./types/ContainsSubStr";
import NotContainsSubStr from "./types/NotContainsSubStr";
import {
    AllOperatorNames,
    BinaryOperatorName, OperatorName,
    UnaryOperatorName
} from "../../interfaces/OperatorName";
import DenyList from "./types/DenyList";
import IsTypeOf from "./types/IsTypeOf";
import Like from "./types/Like";
import AllowList from "./types/AllowList";
import NotLike from "./types/NotLike";
import RegEx from "./types/RegEx";
import PropertyExists from "./types/PropertyExists";
import PropertyNotExists from "./types/PropertyNotExists";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import NotEqual from "@app_component/operator_builder/classes/if_operator/types/NotEqual";
import LessThan from "@app_component/operator_builder/classes/if_operator/types/LessThan";
import LessThanOrEqual from "@app_component/operator_builder/classes/if_operator/types/LessThanOrEqual";
import GreaterThan from "@app_component/operator_builder/classes/if_operator/types/GreaterThan";
import GreaterThanOrEqualTo from "@app_component/operator_builder/classes/if_operator/types/GreaterThanOrEqual";
import OperatorsConfigGenerator from "@app_component/operator_builder/classes/OperatorsConfigGenerator";
import IfBaseOperator from "@app_component/operator_builder/classes/if_operator/IfBaseOperator";
import {Step} from "react-joyride";

export default class IfOperatorsConfigGenerator extends OperatorsConfigGenerator {

    constructor() {
        super(Object.values(AllOperatorNames));
    }
    getOperatorClass(operatorName: OperatorName): IfBaseOperator {
        switch (operatorName) {
            case UnaryOperatorName.IsEmpty:
                return new IsEmpty();
            case UnaryOperatorName.NotEmpty:
                return new IsNotEmpty();
            case UnaryOperatorName.IsNull:
                return new IsNull();
            case UnaryOperatorName.NotNull:
                return new IsNotNull();
            case BinaryOperatorName.Equal:
                return new Equal();
            case BinaryOperatorName.NotEqual:
                return new NotEqual();
            case BinaryOperatorName.LessThan:
                return new LessThan();
            case BinaryOperatorName.LessThanOrEqualTo:
                return new LessThanOrEqual();
            case BinaryOperatorName.GreaterThan:
                return new GreaterThan();
            case BinaryOperatorName.GreaterThanOrEqualTo:
                return new GreaterThanOrEqualTo();
            case BinaryOperatorName.Contains:
                return new Contains();
            case BinaryOperatorName.NotContains:
                return new NotContains();
            case BinaryOperatorName.ContainsSubStr:
                return new ContainsSubStr();
            case BinaryOperatorName.NotContainsSubStr:
                return new NotContainsSubStr();
            case BinaryOperatorName.AllowList:
                return new AllowList();
            case BinaryOperatorName.DenyList:
                return new DenyList();
            case BinaryOperatorName.IsTypeOf:
                return new IsTypeOf();
            case BinaryOperatorName.Like:
                return new Like();
            case BinaryOperatorName.NotLike:
                return new NotLike();
            case BinaryOperatorName.PropertyExists:
                return new PropertyExists();
            case BinaryOperatorName.PropertyNotExists:
                return new PropertyNotExists();
            case BinaryOperatorName.RegEx:
                return new RegEx();
        }
    }

    getTourSteps(operatorName: OperatorName): Step[] {
        return (this.getOperatorClass(operatorName)).getTourSteps();
    }

    getOption(operatorName: OperatorName): OptionType {
        return (this.getOperatorClass(operatorName)).getOption();
    }

    getOptions(operatorNames: OperatorName[]): OptionType[] {
        let result: OptionType[] = [];
        for(let i = 0; i < operatorNames.length; i++) {
            result.push(this.getOption(operatorNames[i]));
        }
        return result;
    }

    getAllOptions(): OptionType[] {
        return this.getOptions(Object.values(AllOperatorNames));
    }
}
