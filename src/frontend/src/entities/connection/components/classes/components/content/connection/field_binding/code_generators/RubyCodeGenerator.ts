import { ICodeGenerator } from './ICodeGenerator';
import CodeGenerator from "@classes/content/connection/field_binding/code_generators/CodeGenerator";

export class RubyCodeGenerator extends CodeGenerator implements ICodeGenerator {
    constructor(fieldBinding: any) {
        super(fieldBinding);
    }

    getDefaultExpertCode(): string {
        return `RESULT_VAR = VAR_0`;
    }
}
