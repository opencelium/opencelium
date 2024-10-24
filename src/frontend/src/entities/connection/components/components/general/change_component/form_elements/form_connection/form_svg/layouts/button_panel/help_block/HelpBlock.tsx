/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect, FC } from "react";
import ReactDOM from "react-dom";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockStyled } from "./styles";
import { ColorTheme } from "@style/Theme";
import { useAppDispatch } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";
// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Content from "./content/Content";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import {setAnimationPaused, setIsEditableAnimation} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";
import { setIsAnimationNotFound } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import AnimationSpeed from "./AnimationSpeed/AnimationSpeed";
import { AnimationPopoverProps } from "./AnimationPopover/interfaces";
import AnimationPopover from "./AnimationPopover/AnimationPopover";
import { getAllInvokers } from "@entity/invoker/redux_toolkit/action_creators/InvokerCreators";
import { Invoker } from "@entity/invoker/classes/Invoker";
import Loading from "@app_component/base/loading/Loading";
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import SyncInvokers from "@entity/connection/components/components/general/change_component/form_elements/form_connection/form_methods/SyncInvokers";
import Shortcuts from "./shortcuts/Shortcuts";
import AnimationEditor from './AnimationEditor';
import AnimationOverlay from "./AnimationOverlay";


const HelpBlock: FC<{entity: any, updateEntity: any, readOnly?: boolean, theme?: any}> = ({entity, updateEntity, readOnly}) => {
  const dispatch = useAppDispatch();
  const { connectors } = Connector.getReduxState();
  const { gettingInvokers } = Invoker.getReduxState();
  const [ isVisible, setIsVisible ] = useState(false);
  const { isButtonPanelOpened, videoAnimationName, animationSpeed, isAnimationNotFound, isAnimationForcedToStop } = Connection.getReduxState();
  const { isAnimationPaused: isPaused, isEditableAnimation } = ModalConnection.getReduxState();

  const [popoverProps, setPopoverProps] = useState<AnimationPopoverProps>(null);

  const videoAnimationNameReference: any = React.useRef();
  videoAnimationNameReference.current = videoAnimationName;

  const isPausedReference: any = React.useRef();
  isPausedReference.current = isPaused;

  const isEditableAnimationReference: any = React.useRef();
  isEditableAnimationReference.current = isEditableAnimation;
  const animationSpeedReference: any = React.useRef();
  animationSpeedReference.current = animationSpeed;

  useEffect(() => {
    if(gettingInvokers !== API_REQUEST_STATE.FINISH) {
      dispatch(getAllInvokers())
    }
  }, [])
    useEffect(() => {
        if(isEditableAnimationReference.current){
            setPopoverProps({ isOpen: false });
        }
    }, [isEditableAnimationReference.current])
  function toggleVisibleHelpDialog() {
    setIsVisible(!isVisible);
  }

  const [isShortcutsDialogOpened, setIsShortcutsDialogOpened] = useState(false);
  const animationControlStyle: any = {};
  if(videoAnimationName === '' || isEditableAnimationReference.current){
      animationControlStyle.display = 'none';
  }
  return (
    <HelpBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      <div style={{ display: "flex", gap: "15px" }}>
        <TooltipButton
          size={TextSize.Size_40}
          position={"bottom"}
          icon={"video_library"}
          tooltip={"Help"}
          target={`help_connection_button`}
          hasBackground={true}
          background={!isVisible ? ColorTheme.White : ColorTheme.Blue}
          color={!isVisible ? ColorTheme.Gray : ColorTheme.White}
          padding="2px"
          handleClick={() => toggleVisibleHelpDialog()}
        />
        <AnimationPopover {...popoverProps}/>
        <Dialog
          actions={[]}
          title="Videoanimations"
          active={isVisible}
          toggle={() => setIsVisible(!isVisible)}
          dialogTheme={{
            content: `${styles.help_dialog_content}`,
            body: `${styles.help_dialog_body}`,
            footer: `${styles.help_dialog_footer}`,
            backdrop: `${styles.help_dialog_backdrop}`,
          }}
          dialogClassname={`${styles.help_dialog}`}
        >
          {ReactDOM.createPortal(
            <React.Fragment>
              <div style={animationControlStyle} className={styles.animation_controls}>
                <TooltipButton
                  isDisabled={isEditableAnimationReference.current}
                  size={TextSize.Size_40}
                  position={"bottom"}
                  icon={isPausedReference.current ? "play_arrow" : "pause"}
                  tooltip={isPausedReference.current ? "Play Animation" : 'Pause Animation'}
                  target={`animation_play_button`}
                  hasBackground={true}
                  background={ColorTheme.White}
                  color={ColorTheme.Blue}
                  padding="2px"
                  handleClick={() => dispatch(setAnimationPaused(!isPausedReference.current))}
                />
                <AnimationSpeed/>
                <TooltipButton
                  size={TextSize.Size_40}
                  position={"bottom"}
                  icon={"stop"}
                  tooltip={"Stop"}
                  isDisabled={!isPausedReference.current}
                  target={`animation_edit_button`}
                  hasBackground={true}
                  background={ColorTheme.White}
                  color={ColorTheme.Blue}
                  padding="2px"
                  handleClick={() => dispatch(setIsEditableAnimation(true))}
                />
              </div>
              <AnimationOverlay/>
            </React.Fragment>,
            document.body
          )}
          {gettingInvokers === API_REQUEST_STATE.START && <Loading className="animationDataLoading"/>}
          {gettingInvokers === API_REQUEST_STATE.FINISH &&
            <React.Fragment>
              <ModalContext.Provider value={{ isModal: true }}>
                  <AnimationEditor
                      setPopoverProps={setPopoverProps}
                      isVisible={isVisible}
                  />
              </ModalContext.Provider>
              <Content />
            </React.Fragment>
          }
        </Dialog>
        <Dialog
          actions={[
            {id: 'animationNotFound', label: 'Ok', onClick: () => dispatch(setIsAnimationNotFound(false))}
          ]}
          active={isAnimationNotFound}
          toggle={null}
          title={""}
        >
          <React.Fragment>
              {"This help animation is currently in development. Thank you for your understanding."}
          </React.Fragment>
        </Dialog>
        <SyncInvokers
          isDisabled={readOnly}
          connection={entity}
          updateConnection={updateEntity}
          connectors={connectors}
          tooltipButtonProps={{
            position: "bottom",
            icon: "description",
            tooltip: 'Sync invokers',
            target: 'sync_invokers',
            hasBackground: true,
            padding: "2px"
          }}
        />
        <TooltipButton
          position={"bottom"}
          icon={"keyboard"}
          tooltip={"Shortcuts"}
          target={`shortcuts`}
          hasBackground={true}
          background={!isShortcutsDialogOpened ? ColorTheme.White : ColorTheme.Blue}
          color={!isShortcutsDialogOpened ? ColorTheme.Gray : ColorTheme.White}
          padding="2px"
          handleClick={() => setIsShortcutsDialogOpened(!isShortcutsDialogOpened)}
        />
        <Dialog
          actions={[
            {id: 'shortcutsDialog', label: 'Ok', onClick: () => setIsShortcutsDialogOpened(!isShortcutsDialogOpened)}
          ]}
          active={isShortcutsDialogOpened}
          toggle={() => setIsShortcutsDialogOpened(!isShortcutsDialogOpened)}
          title={"Shortcuts"}
          dialogClassname={styles.shortcutsDialog}
        >
          <React.Fragment>
            <Shortcuts/>
          </React.Fragment>
        </Dialog>
      </div>
    </HelpBlockStyled>
  );
};

HelpBlock.defaultProps = {};

export { HelpBlock };

export default withTheme(HelpBlock);
