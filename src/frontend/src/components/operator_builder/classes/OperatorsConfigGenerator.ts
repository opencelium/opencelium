import IsEmpty from "./IsEmpty";
import IsNotEmpty from "./IsNotEmpty";
import IsNull from "./IsNull";
import IsNotNull from "./IsNotNull";
import Contains from "./Contains";
import NotContains from "./NotContains";
import Equal from "./Equal";
import ContainsSubStr from "./ContainsSubStr";
import NotContainsSubStr from "./NotContainsSubStr";
import {
    AllOperatorNames,
    BinaryOperatorName, OperatorName,
    UnaryOperatorName
} from "../interfaces/OperatorName";
import DenyList from "./DenyList";
import IsTypeOf from "./IsTypeOf";
import Like from "./Like";
import Matches from "./Matches";
import AllowList from "./AllowList";
import NotLike from "./NotLike";
import RegEx from "./RegEx";
import PropertyExists from "./PropertyExists";
import PropertyNotExists from "./PropertyNotExists";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";

export default class OperatorsConfigGenerator{

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
