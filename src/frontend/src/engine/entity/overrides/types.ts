import type { EntityDefinition, FieldDefinition, SectionDefinition, Mode } from '../EntityDefinition'
import React from "react";

export type FieldOverrideProps = {
    field: FieldDefinition
    mode: Mode
    defaultRender: () => React.ReactNode
}

export type SectionOverrideProps = {
    section: SectionDefinition
    fields: FieldDefinition[]
    mode: Mode
    defaultRender: () => React.ReactNode
}

export type WizardOverrideProps = {
    entity: EntityDefinition
    mode: Mode
    defaultRender: () => React.ReactNode
}

export type FieldOverride = React.ComponentType<FieldOverrideProps>
export type SectionOverride = React.ComponentType<SectionOverrideProps>
export type WizardOverride = React.ComponentType<WizardOverrideProps>
