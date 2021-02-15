import React from 'react';
import styles from '@themes/default/general/form_methods.scss';

export const InvokerReferenceFromRequiredData = (props) => {
    return <span className={`${styles.span_reference_invoker_from_required_data} ${props.isSelected ? styles.span_reference_selected : ''}`} data-value="invoker_reference" data-main={`${props.value}`}>{props.value}</span>
};

export const LocalReference = (props) => {
    return <span className={`${styles.span_reference_local} ${props.isSelected ? styles.span_reference_selected : ''}`} style={{background: props.color}} data-value="param" data-main={`${props.value}`}>{props.fieldName}</span>;
};