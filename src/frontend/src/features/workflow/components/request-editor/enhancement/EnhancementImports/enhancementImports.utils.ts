import type { PickerItem } from '@entities/globalVariable/model/types';
import type { Language } from '../../../../types/connection';

// Script variables run in their own language only; constants and mutable values work in any (FR-43).
export const isImportable = (item: PickerItem, language: Language) =>
	item.kind !== 'SCRIPT' || item.language === language;
