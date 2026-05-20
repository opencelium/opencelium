import { MoreOutlined } from '@ant-design/icons';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { RefObject } from 'react';
import type { HistoryVersionItem } from './historyPanel.data';
import { formatTime } from './historyPanel.utils';

type Props = {
  activeId: string | null;
  commentValue: string;
  expandedCommentId: string | null;
  expandedShiftLeft: number;
  expandedWidth: number;
  hoveredCommentId: string | null;
  item: HistoryVersionItem;
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  selectedId: string | null;
  onBlur: (id: string) => void;
  onChangeComment: (id: string, value: string) => void;
  onCopySnapshot: (snapshotId: string) => void;
  onDelete: (id: string) => void;
  onDownloadTemplate: (snapshotId: string) => void;
  onFocus: (id: string) => void;
  onHover: (id: string | null) => void;
  onSave: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleMenu: (id: string) => void;
  setCommentRef: (id: string, element: HTMLDivElement | null) => void;
};

export function HistoryEntryRow(props: Props) {
  const showExpand = props.hoveredCommentId === props.item.id || props.activeId === props.item.id;
  const hasComment = props.commentValue.trim().length > 0;
  const isEditing = props.activeId === props.item.id || props.expandedCommentId === props.item.id;

  return (
    <div className='historyEntryRow'>
      <div className='historyTimeCol'>
        <div className='historyTimeLabel'>{formatTime(props.item.createdAt)}</div>
        <div className={`historyDot ${props.selectedId === props.item.id ? 'historyDotCurrent' : ''}`} />
      </div>
      <div className={`historyCard ${props.selectedId === props.item.id ? 'historyCardSelected' : ''}`}>
        <div className='historyCardHeader historyCardActivator' onClick={() => props.onSelect(props.item.id)}>
          <strong>Author: {props.item.author}</strong>
          <button className='historyDotsButton' type='button' onClick={(event) => { event.stopPropagation(); props.onToggleMenu(props.item.id); }}>
            <MoreOutlined />
          </button>
        </div>
        <div ref={(element) => props.setCommentRef(props.item.id, element)} className='historyCommentWrap' onMouseEnter={() => props.onHover(props.item.id)} onMouseLeave={() => props.onHover(null)}>
          {showExpand ? (
            <button className={`historyExpandButton ${props.expandedCommentId === props.item.id ? 'historyExpandButtonActive' : ''}`} type='button' onClick={(event) => { event.stopPropagation(); props.onToggleExpand(props.item.id); }}>
              {props.expandedCommentId === props.item.id ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          ) : null}
          <textarea
            className={`historyComment ${!hasComment && !isEditing ? 'historyCommentEmpty' : ''} ${props.expandedCommentId === props.item.id ? 'historyCommentExpanded' : ''}`}
            style={props.expandedCommentId === props.item.id ? { width: props.expandedWidth, marginLeft: -props.expandedShiftLeft } : undefined}
            placeholder='Comment'
            value={props.commentValue}
            onClick={(event) => event.stopPropagation()}
            onFocus={() => props.onFocus(props.item.id)}
            onBlur={() => props.onBlur(props.item.id)}
            onChange={(event) => props.onChangeComment(props.item.id, event.target.value)}
          />
        </div>
        {props.activeId === props.item.id || props.expandedCommentId === props.item.id ? (
          <div className='historySaveRow'>
            <button
              className='primaryButton historySaveButton'
              type='button'
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                props.onSave(props.item.id);
              }}
            >
              Save
            </button>
          </div>
        ) : null}
        {props.menuOpen ? (
          <div ref={props.menuRef} className='historyMenu'>
            <button className='historyMenuItem' type='button' onClick={() => props.onCopySnapshot(props.item.snapshotId)}>Copy snapshotid</button>
            <button className='historyMenuItem' type='button' onClick={() => props.onDownloadTemplate(props.item.snapshotId)}>Download as Template</button>
            <button className='historyMenuItem historyMenuItemDanger' type='button' onClick={() => props.onDelete(props.item.id)}>Delete</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
