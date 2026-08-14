import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { BodyPointerProps } from './BodyPointer.types';
import { BodyPointerEditorPopup } from './BodyPointerEditorPopup';
import { useBodyPointerState } from './useBodyPointerState';
import './BodyPointer.css';

export function BodyPointer({ pointer, pointers, onClick, onRemove, onEdit, connection, currentMethod }: BodyPointerProps) {
  const { t: tWorkflow } = useI18n('workflow');
  const state = useBodyPointerState({ pointer, pointers, onClick, onRemove, onEdit,
    connection, currentMethod });

  return (
    <div
      title={state.title}
      onClick={onClick}
      onMouseEnter={state.showMenu}
      onMouseLeave={() => state.setHovered(false)}
      style={{
        position: 'relative',
        float: 'left',
        margin: '7px 2px',
        width: 20,
        height: 10,
        background: state.color,
        cursor: 'pointer',
      }}
    >
      {state.hovered ? (
        <div className={`bodyPointerMenu ${state.menuBelow ? 'bodyPointerMenu--below' : ''}`}>
          <div className='bodyPointerMenuList'>
            {state.canEdit && (
              <button type='button' className='bodyPointerMenuItem' onClick={state.openEditor}>
                <EditOutlined style={{ fontSize: 12 }} />
                {tWorkflow('actions.edit')}
              </button>
            )}
            <button type='button' className='bodyPointerMenuItem bodyPointerMenuItem--danger' onClick={state.remove}>
              <DeleteOutlined style={{ fontSize: 12 }} />
              {tWorkflow('actions.delete')}
            </button>
          </div>
        </div>
      ) : null}
      <BodyPointerEditorPopup connection={connection} currentMethod={currentMethod}
        position={state.editorPos} onApply={(reference) => {
          onEdit?.(pointer, pointers, reference);
          state.setEditorPos(null);
        }} />
    </div>
  );
}
