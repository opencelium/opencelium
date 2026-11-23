import { Button } from '@shared/ui/primitives/Button';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { buildTestId } from '@shared/testing/testId';
import type { ListDefinition } from '@/engine/entity/EntityDefinition';
import './ListViewSwitch.css';

type Props = {
    entityName: string;
    alternateView: NonNullable<ListDefinition['alternateView']>;
    isAlternate: boolean;
    onChange: (isAlternate: boolean) => void;
};

export function ListViewSwitch({ entityName, alternateView, isAlternate, onChange }: Props) {
    const { t } = useI18n('entities');
    return (
        <div className="list-view-switch" role="group">
            <Button
                type={isAlternate ? 'default' : 'primary'}
                testId={buildTestId(entityName, 'view-list')}
                onClick={() => onChange(false)}
            >
                {t(alternateView.listLabelKey)}
            </Button>
            <Button
                type={isAlternate ? 'primary' : 'default'}
                testId={buildTestId(entityName, 'view-alternate')}
                onClick={() => onChange(true)}
            >
                {t(alternateView.labelKey)}
            </Button>
        </div>
    );
}
