import {ReferenceType} from "@app_component/operator_builder/reference_generator/props";

export default abstract class BaseReference {
    reference: string;
    type: ReferenceType;

    protected constructor(reference: string) {
        this.reference = reference;
    }

    abstract extractData(): any | null;

    hasRightFormat(): boolean {
        return this.extractData() !== null
    }

}
