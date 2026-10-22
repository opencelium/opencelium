import type { ReactNode, RefObject } from 'react';
import type { ResponseType } from '../../body-editor/requestReferenceOptions';
import type { ReferencePathFeedback } from '../../body-editor/referencePathSyntax';

export type ReferenceMethodFieldControlsProps = {
  methodLabel: string;
  fieldLabel: string;
  methodId: string;
  methodOptions: { value: string; label: ReactNode; searchLabel?: string }[];
  methodPlaceholder: string;
  methodDisabled: boolean;
  onMethodChange: (id: string) => void;
  fieldContainerRef: RefObject<HTMLDivElement | null>;
  fieldInputRef: RefObject<HTMLInputElement | null>;
  responseTypes: ResponseType[];
  responseType: ResponseType;
  onResponseTypeChange: (type: ResponseType) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFieldFocus: () => void;
  onFieldBlur: () => void;
  fieldPlaceholder: string;
  fieldDisabled: boolean;
  fieldFeedback?: ReferencePathFeedback | null;
};
