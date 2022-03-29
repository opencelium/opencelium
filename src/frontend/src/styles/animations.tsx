import {css, keyframes} from "styled-components";

export const KeyframeSelectedCard = keyframes`
  from {
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  }
  to {
    background-color: #ffffff;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.12), 1px 3px 15px rgba(0, 0, 0, 0.24);
  }
`;

const KeyframeScaleAppear = keyframes`
  from {
    transform: scale(0) translate3d(100%, -100%, 0);
    opacity: 0;
  }
  to {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 1;
  }
`;

const KeyframeAppearance = keyframes`
  from {
    opacity: 0;
  }
  to {
    transform: 1;
  }
`;

const KeyframeScheduleDataAppearance = keyframes`
  0 {
    background: #fff;
  }
  50% {
    background: #7aced2;
  }
  100% {
    background: #fff;
  }
`;

const KeyframeGridImageRefreshing = keyframes`
    from{
        margin-top: -5px;
        opacity: 0;
    }
    to{
        margin-top: 0;
        opacity: 1
    }
`;

const KeyframeSlideTop = keyframes`
    0% {
    }
    
    100% {
        top: 22px;
        opacity: 0;
    }
`;

const KeyframeGridImageShow = keyframes`
    0% {
        opacity: 0;
        margin-top: -20px;
    }
    
    100% {
        margin-top: 0;
        opacity: 1;
    }
`;

export const SlideToTop = css`
    animation-delay: 2.5s;
    animation-name: ${KeyframeSlideTop};
    animation-duration: 0.5s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`

export const Appearance = css`
    animation: ${KeyframeAppearance} 0.5s linear;
    animation-fill-mode: forwards;
`;
export const ScheduleDataAppearance = css`
    animation: ${KeyframeScheduleDataAppearance} 0.5s linear;
    animation-fill-mode: forwards;
`;

export const SelectedCard = css`
  animation-name: ${KeyframeSelectedCard};
  animation-duration: 0.4s;
  animation-fill-mode: forwards;
  animation-timing-function:ease-in;
`;

export const NotificationListAppearance = css`
  animation-name: ${KeyframeScaleAppear};
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
`;

export const GridImageAppearance = css`
  animation-name: ${KeyframeGridImageShow};
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
`;

export const GridImageRefreshing = css`
  animation-name: ${KeyframeGridImageRefreshing};
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
`;