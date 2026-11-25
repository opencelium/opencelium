import type { Mode } from '@/engine/entity/EntityDefinition'
import type { ScheduleUpdateDTO } from './types'

type ScheduleFormData = Omit<ScheduleUpdateDTO, 'status'> & { status?: ScheduleUpdateDTO['status'] }

/** A new schedule is active unless the caller says otherwise; updates keep whatever status they carry. */
export function mapScheduleToApi(mode: Mode, data: ScheduleFormData) {
    return mode === 'create' ? { ...data, status: data.status ?? true } : data
}
