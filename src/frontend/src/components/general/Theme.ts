import {TextSize} from "@atom/text/interfaces";

export enum ColorTheme {
    Black = '#000000',
    White = '#fff',
    Turquoise = '#00ACC2',
    Blue = '#007bff',
    LightGray= 'rgba(33, 33, 33, 0.26)',
    Gray = '#777',
    DarkBlue = '#012E55',
    Red = '#ba3f3f',
    DarkGray = '#666666',
    Green = '#01553d',
}
export interface IColorStates{
    quite: ColorTheme,
    hover?: string,
    active?: string,
    focus?: string,
    disable?: string,
}
type ICollectionView = {
    title: IText;
}
type IButton = {
    color: IColorStates;
    background: IColorStates,
};
type IIcon = {
    color: IColorStates;
};
type IInputText = {
    color: IColorStates,
}
type IInputError = {
    color: string,
}
type IInputElement = {
    paddingTop?: string,
    paddingBottom?: string,
}
type IInput = {
    iconInputDistance?: string,
    inputElement?: IInputElement,
    text: IInputText,
    error: IInputError,
}

type IText = {
    fontFamily?: string,
    color?: IColorStates,
    size?: TextSize,
}

type IMenu = {
    background?: ColorTheme,
}

export interface ITheme{
    menu: IMenu,
    icon: IIcon,
    button: IButton,
    input: IInput,
    text: IText,
    collectionView: ICollectionView,
}

const defaultTheme: ITheme = {
    menu: {
      background: ColorTheme.DarkBlue,
    },
    button: {
        background: {
            quite: ColorTheme.Blue,
            hover: '#47a7f5 radial-gradient(circle, transparent 1%, #47a7f5 1%) center/15000%',
            active: '#0062cc',
        },
        color: {
            quite: ColorTheme.White,
        },
    },
    icon: {
        color: {
            quite: ColorTheme.Black,
        },
    },
    input: {
        iconInputDistance: '50px',
        inputElement: {
            paddingTop: '5px',
            paddingBottom: '3px',
        },
        text:{
            color: {
                quite: ColorTheme.DarkBlue,
                disable: ColorTheme.Gray,
            },
        },
        error:{
            color: ColorTheme.Red,
        }
    },
    text: {
        fontFamily: `"Open Sans", "Arial", sans-serif`,
        color: {
            quite: ColorTheme.Black,
        },
        size: TextSize.Size_16,
    },
    collectionView: {
        title:{
            color: {
                quite: ColorTheme.Gray,
            }
        }
    }
}
const greenTheme: ITheme = {
    menu: {
        background: ColorTheme.Green,
    },
    button: {
        background: {
            quite: ColorTheme.Blue,
            hover: '#47a7f5 radial-gradient(circle, transparent 1%, #47a7f5 1%) center/15000%',
            active: '#0062cc',
        },
        color: {
            quite: ColorTheme.White,
        },
    },
    icon: {
        color: {
            quite: ColorTheme.Black,
        },
    },
    input: {
        iconInputDistance: '50px',
        inputElement: {
            paddingTop: '5px',
            paddingBottom: '3px',
        },
        text:{
            color: {
                quite: ColorTheme.DarkBlue,
                disable: ColorTheme.Gray,
            },
        },
        error:{
            color: ColorTheme.Red,
        }
    },
    text: {
        fontFamily: `"Open Sans", "Arial", sans-serif`,
        color: {
            quite: ColorTheme.Black,
        },
        size: TextSize.Size_16,
    },
    collectionView: {
        title:{
            color: {
                quite: ColorTheme.Gray,
            }
        }
    }
}

export type ThemeNames = 'default' | 'other';

export default {
    other: greenTheme,
    default: defaultTheme,
}