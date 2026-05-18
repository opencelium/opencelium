import React from 'react';
import {MetaText} from "@shared/ui/primitives/Text";
import type {LeafKeys} from "@shared/i18n/types/types.ts";
import type {I18nSchema} from "@shared/i18n/types/schemes/schemes.ts";
import {Divider} from "@shared/ui/primitives/Divider";

type FieldsSectionTypes = {
    label: LeafKeys<I18nSchema['meta']>,
    children: React.ReactNode,
}

const FieldsSection = ({label, children}: FieldsSectionTypes) => {
    return (
        <div style={{marginTop: 5}}>
            <div style={{
                margin: '0px 0px 10px',
                fontSize: '12px',
                color: 'rgb(102, 102, 102)'
            }}>
                <MetaText i18nKey={label} typoProps={{variant: 'section-label', isBold: true}}/>
            </div>{/*
            <Divider placement={'left'}>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <MetaText i18nKey={label} variant={'label'} isUppercase isBold/>
                </div>
            </Divider>*/}
            <div style={{gap: 10, display: 'grid'}}>
                {React.Children.map(children, (child) => (
                    <div>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FieldsSection;
