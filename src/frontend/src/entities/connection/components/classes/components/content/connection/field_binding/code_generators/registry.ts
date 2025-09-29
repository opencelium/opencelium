import { ICodeGenerator } from './ICodeGenerator';
import { JSCodeGenerator } from './JSCodeGenerator';
import { RubyCodeGenerator } from './RubyCodeGenerator';
import {PythonCodeGenerator} from "@classes/content/connection/field_binding/code_generators/PythonCodeGenerator";

export const codeGeneratorRegistry: Record<string, (fieldBinding: any) => ICodeGenerator> = {
    js: (fieldBinding: any) => new JSCodeGenerator(fieldBinding),
    ruby: (fieldBinding: any) => new RubyCodeGenerator(fieldBinding),
    python: (fieldBinding: any) => new PythonCodeGenerator(fieldBinding),
};
