import React from 'react'
import { GlobalVariableDetail } from '../detail/GlobalVariableDetail'
import { GlobalVariableUpdateForm } from '../form/GlobalVariableUpdateForm'

type Props = {
    id: number
    mode: 'view' | 'update'
    close: () => void
}

/** The view and update screens inside a dialog (list row actions, command palette in modal mode). */
export const GlobalVariableDialogContent: React.FC<Props> = ({ id, mode, close }) =>
    mode === 'view' ? <GlobalVariableDetail id={id} /> : <GlobalVariableUpdateForm id={id} onSaved={close} />
