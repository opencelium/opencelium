import type {
    FieldOverride,
    SectionOverride,
    WizardOverride
} from './types'

class OverrideRegistry {
    private fieldOverrides = new Map<string, FieldOverride>()
    private sectionOverrides = new Map<string, SectionOverride>()
    private wizardOverrides = new Map<string, WizardOverride>()

    registerField(key: string, comp: FieldOverride) {
        this.fieldOverrides.set(key, comp)
    }

    registerSection(key: string, comp: SectionOverride) {
        this.sectionOverrides.set(key, comp)
    }

    registerWizard(key: string, comp: WizardOverride) {
        this.wizardOverrides.set(key, comp)
    }

    getField(key?: string) {
        return key ? this.fieldOverrides.get(key) : undefined
    }

    getSection(key?: string) {
        return key ? this.sectionOverrides.get(key) : undefined
    }

    getWizard(key?: string) {
        return key ? this.wizardOverrides.get(key) : undefined
    }
}

export const overrideRegistry = new OverrideRegistry()
