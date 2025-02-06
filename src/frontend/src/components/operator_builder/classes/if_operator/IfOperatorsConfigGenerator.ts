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
import Matches from "./types/Matches";
import AllowList from "./types/AllowList";
import NotLike from "./types/NotLike";
import RegEx from "./types/RegEx";
import PropertyExists from "./types/PropertyExists";
import PropertyNotExists from "./types/PropertyNotExists";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";

export default class IfOperatorsConfigGenerator {

    constructor() {
    }
    getOption(operatorName: OperatorName): OptionType {
        switch (operatorName) {
            case UnaryOperatorName.IsEmpty:
                return (new IsEmpty()).getOption();
            case UnaryOperatorName.IsNotEmpty:
                return (new IsNotEmpty()).getOption();
            case UnaryOperatorName.IsNull:
                return (new IsNull()).getOption();
            case UnaryOperatorName.IsNotNull:
                return (new IsNotNull()).getOption();
            case BinaryOperatorName.Equal:
                return (new Equal()).getOption();
            case BinaryOperatorName.Contains:
                return (new Contains()).getOption();
            case BinaryOperatorName.NotContains:
                return (new NotContains()).getOption();
            case BinaryOperatorName.ContainsSubStr:
                return (new ContainsSubStr()).getOption();
            case BinaryOperatorName.NotContainsSubStr:
                return (new NotContainsSubStr()).getOption();
            case BinaryOperatorName.AllowList:
                return (new AllowList()).getOption();
            case BinaryOperatorName.DenyList:
                return (new DenyList()).getOption();
            case BinaryOperatorName.IsTypeOf:
                return (new IsTypeOf()).getOption();
            case BinaryOperatorName.Like:
                return (new Like()).getOption();
            case BinaryOperatorName.NotLike:
                return (new NotLike()).getOption();
            case BinaryOperatorName.Matches:
                return (new Matches()).getOption();
            case BinaryOperatorName.PropertyExists:
                return (new PropertyExists()).getOption();
            case BinaryOperatorName.PropertyNotExists:
                return (new PropertyNotExists()).getOption();
            case BinaryOperatorName.RegEx:
                return (new RegEx()).getOption();
        }
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
