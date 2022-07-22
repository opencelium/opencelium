
/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {TextSize} from "@app_component/base/text/interfaces";
import {LocalStorageTheme} from "@application/interfaces/IApplication";

export enum ColorTheme {
    Black = '#000000',
    White = '#fff',
    Turquoise = '#00ACC2',
    Blue = '#007bff',
    ToolboxBlue = '#0062cc',
    LightGray= 'rgba(33, 33, 33, 0.26)',
    Gray = '#777',
    DarkBlue = '#012E55',
    Red = '#ba3f3f',
    DarkGray = '#666666',
    Green = '#01553d',
    BeconBlue = '#2372ba',
    BeconDarkYellow = '#fac000',
    BeconYellow = '#e8b200',
}
export interface IColorStates{
    quite?: string,
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
    background?: string,
    menuItem?: IColorStates,
}

export interface ITheme{
    progressBarElement?: {
        background: string,
    },
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
        menuItem: {
            hover: ColorTheme.Turquoise,
        }
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
                quite: ColorTheme.ToolboxBlue,
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
        menuItem: {
            hover: ColorTheme.Turquoise,
        }
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
const beconClassicTheme: ITheme = {
    progressBarElement: {
        background: ColorTheme.BeconBlue,
    },
    menu: {
        background: ColorTheme.BeconDarkYellow,
        menuItem: {
            hover: ColorTheme.BeconYellow,
        }
    },
    button: {
        background: {
            quite: ColorTheme.BeconBlue,
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
                quite: ColorTheme.BeconDarkYellow,
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

export function updateThemeWithColors(theme: ITheme, localStorageTheme: LocalStorageTheme){
    let updatedTheme = {...theme};
    const colors = localStorageTheme?.colors || null;
    if(colors && colors.hasOwnProperty('action') && colors.hasOwnProperty('menu') && colors.hasOwnProperty('header')){
        if(updatedTheme.progressBarElement){
            updatedTheme.progressBarElement.background = colors.action;
        }
        updatedTheme.menu.background = colors.menu;
        updatedTheme.menu.menuItem.hover = colors.header;
        updatedTheme.button.background.quite = colors.action;
        updatedTheme.input.text.color.quite = colors.menu;
    }
    return updatedTheme;
}

export const DefaultThemes: LocalStorageTheme[] = [
    {name: 'Default', isCurrent: true, colors: {action: '#007bff', header: '#00ACC2', menu: '#012E55'}},
    {name: 'Green Day', colors: {action: '#007bff', header: '#00ACC2', menu: '#01553d'}},
    {name: 'Becon Classic', colors: {action: '#2372ba', header: '#fac000', menu: '#e8b200'}}
]
export const DefaultTheme = DefaultThemes.find(theme => theme.isCurrent);

export enum ThemeNames{
    Default= 'default',
    GreenDay= 'green_day',
    BeconClassic= 'becon_classic'
}

export default {
    green_day: greenTheme,
    default: defaultTheme,
    becon_classic: beconClassicTheme,
}