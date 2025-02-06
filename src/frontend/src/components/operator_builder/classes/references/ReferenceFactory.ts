import BaseReference from "@app_component/operator_builder/classes/references/BaseReference";
import {ReferenceType} from "@app_component/operator_builder/reference_generator/props";

type ReferenceConstructor = new (...args: any[]) => BaseReference;

export default class ReferenceFactory {
    private static registeredTypes: ReferenceConstructor[] = [];

    static registerType(referenceClass: ReferenceConstructor) {
        this.registeredTypes.push(referenceClass);
    }

    static createReferenceInstance(referenceOrColor: string, type?: string, field?: string): BaseReference {
        for (const RefType of this.registeredTypes) {
            const instance = new RefType(referenceOrColor, type, field);
            if (instance.hasRightFormat()) {
                return instance;
            }
        }
        return null;
    }

    static getReference(referenceType: ReferenceType, referenceOrColor: string, type?: string, field?: string): string {
        for (const RefType of this.registeredTypes) {
            const instance = new RefType(referenceOrColor, type, field);
            if (instance.type === referenceType) {
                return instance.reference;
            }
        }
        return referenceOrColor
    }
}
