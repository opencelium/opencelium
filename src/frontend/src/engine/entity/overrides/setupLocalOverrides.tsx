import { overrideRegistry } from './overrideRegistry';
import { FieldRenderer } from '@/engine/entity/runtime/FieldRenderer';
import {LdapLogs} from "@shared/ui/wizard-step/view/ldap-logs/LdapLogs.tsx";
import {PermissionEditor} from "@shared/ui/wizard-step/editor/permission-editor/PermissionEditor.tsx";
import {CredentialEditor} from "@shared/ui/wizard-step/editor/credential-editor/CredentialEditor.tsx";
import {CronEditor} from "@shared/ui/wizard-step/editor/cron-editor/CronEditor.tsx";
import {ParentCategoryEditor} from "@shared/ui/wizard-step/editor/parent-category-editor/ParentCategoryEditor.tsx";
import {AggregatorWithArgsEditor} from "@shared/ui/wizard-step/editor/aggregator-with-args-editor/AggregatorWithArgsEditor.tsx";
import {TemplateSubjectEditor} from "@shared/ui/wizard-step/editor/template-subject-editor/TemplateSubjectEditor.tsx";
import {TemplateBodyEditor} from "@shared/ui/wizard-step/editor/template-body-editor/TemplateBodyEditor.tsx";
import {DataAggregatorArgsEditor} from "@shared/ui/wizard-step/editor/data-aggregator-args-editor/DataAggregatorArgsEditor.tsx";
import {DataAggregatorScriptEditor} from "@shared/ui/wizard-step/editor/data-aggregator-script-editor/DataAggregatorScriptEditor.tsx";
import {InvokerRequiredDataEditor} from "@shared/ui/wizard-step/editor/invoker-required-data-editor/InvokerRequiredDataEditor.tsx";
import {InvokerOperationsEditor} from "@shared/ui/wizard-step/editor/invoker-operations-editor/InvokerOperationsEditor.tsx";
import {UpdateAssistantHealthViewer} from "@shared/ui/wizard-step/editor/update-assistant-health-viewer/UpdateAssistantHealthViewer.tsx";
import {UpdateAssistantVersionsTable} from "@shared/ui/wizard-step/editor/update-assistant-versions-table/UpdateAssistantVersionsTable.tsx";
import {UpdateAssistantRunButton} from "@shared/ui/wizard-step/editor/update-assistant-run-button/UpdateAssistantRunButton.tsx";
import {CustomThemeSection} from "@entities/ui/ui/CustomThemeSection";
import {NotificationEventTypeField} from "@entities/schedule/notification/overrides/NotificationEventTypeField";
import {NotificationTemplateField} from "@entities/schedule/notification/overrides/NotificationTemplateField";
import {NotificationRecipientsEmailsField} from "@entities/schedule/notification/overrides/NotificationRecipientsEmailsField";
import {NotificationRecipientsWebhookField} from "@entities/schedule/notification/overrides/NotificationRecipientsWebhookField";

export function setupLocalOverrides() {
    overrideRegistry.registerField('permissionEditor', ({ field, mode }) => (
        <PermissionEditor name={field.name} label={field.label} mode={mode}/>
    ));
    overrideRegistry.registerField('ldapLogs', ({ field }) => (
        <LdapLogs logs={field.data}/>
    ));
    overrideRegistry.registerField('credentialEditor', ({ field, mode }) => (
        <CredentialEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('cronEditor', ({ field, mode }) => (
        <CronEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('parentCategoryEditor', ({ field, mode }) => (
        <ParentCategoryEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('aggregatorWithArgsEditor', ({ field, mode }) => (
        <AggregatorWithArgsEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('templateSubjectEditor', ({ field, mode }) => (
        <TemplateSubjectEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('templateBodyEditor', ({ field, mode }) => (
        <TemplateBodyEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('dataAggregatorArgsEditor', ({ field, mode }) => (
        <DataAggregatorArgsEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('dataAggregatorScriptEditor', ({ field, mode }) => (
        <DataAggregatorScriptEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('invokerRequiredDataEditor', ({ field, mode }) => (
        <InvokerRequiredDataEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('invokerOperationsEditor', ({ field, mode }) => (
        <InvokerOperationsEditor name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('updateAssistantHealthViewer', ({ field }) => (
        <UpdateAssistantHealthViewer name={field.name} label={field.label} />
    ));
    overrideRegistry.registerField('updateAssistantVersionsTable', ({ field, mode }) => (
        <UpdateAssistantVersionsTable name={field.name} label={field.label} mode={mode} />
    ));
    overrideRegistry.registerField('updateAssistantRunButton', ({ field, mode }) => (
        <UpdateAssistantRunButton name={field.name} label={field.label} mode={mode} />
    ));
    // Theme step of the UI settings wizard: theme select + custom theme editor
    // below it, spaced with the step form's standard 15px grid gap.
    overrideRegistry.registerSection('uiThemeSection', ({ fields, mode }) => (
        <div style={{ marginBottom: 32, display: 'grid', gap: 15 }}>
            {fields.map(field => (
                <FieldRenderer key={field.name} field={field} mode={mode} />
            ))}
            <CustomThemeSection />
        </div>
    ));
    overrideRegistry.registerField('scheduleNotificationEventType', NotificationEventTypeField);
    overrideRegistry.registerField('scheduleNotificationTemplate', NotificationTemplateField);
    overrideRegistry.registerField('scheduleNotificationRecipientsEmails', NotificationRecipientsEmailsField);
    overrideRegistry.registerField('scheduleNotificationRecipientsWebhook', NotificationRecipientsWebhookField);
}
