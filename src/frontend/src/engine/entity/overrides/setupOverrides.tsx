import { overrideRegistry } from './overrideRegistry';
import {FieldEditor} from "@shared/ui/wizard-step/editor/field-editor/FieldEditor.tsx";
import {PolicyEditor} from "@shared/ui/wizard-step/editor/policy-editor/PolicyEditor.tsx";
import {CrossValidationEditor} from "@shared/ui/wizard-step/editor/cross-validation-editor/CrossValidationEditor.tsx";
import {SectionEditor} from "@shared/ui/wizard-step/editor/section-editor/SectionEditor.tsx";
import {StepEditor} from "@shared/ui/wizard-step/editor/wizard-editor/StepEditor.tsx";
import {RecommendationEditor} from "@shared/ui/wizard-step/editor/wizard-editor/RecommendationEditor.tsx";
import {WizardModeEditor} from "@shared/ui/wizard-step/editor/wizard-editor/ModeEditor.tsx";
import FormCodeEditor from "@shared/ui/form/FormCodeEditor";

export function setupGlobalOverrides() {
    overrideRegistry.registerField('fieldEditor', ({ field }) => {
        return <FieldEditor name={field.name} label={field.label} />;
    });

    overrideRegistry.registerField('policyEditor', ({ field }) => (
        <PolicyEditor name={field.name} label={field.label} />
    ));

    overrideRegistry.registerField('codeEditor', ({ field }) => (
        <FormCodeEditor name={field.name} label={field.label} {...field.ui.props} />
    ));

    overrideRegistry.registerField('crossValidationEditor', ({ field }) => (
        <CrossValidationEditor name={field.name} label={field.label} />
    ));

    overrideRegistry.registerField('sectionEditor', ({ field }) => (
        <SectionEditor name={field.name} label={field.label} />
    ));

    overrideRegistry.registerField('wizardEditor', ({ field }) => (
        <StepEditor name={field.name} label={field.label} />
    ));

    overrideRegistry.registerField('recommendationEditor', ({ field }) => (
        <RecommendationEditor name={field.name} label={field.label} />
    ));

    overrideRegistry.registerField('wizardModeEditor', ({ field }) => (
        <WizardModeEditor name={field.name} />
    ));
}
