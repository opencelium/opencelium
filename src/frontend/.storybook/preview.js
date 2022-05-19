import React from 'react';
import { ThemeProvider } from 'styled-components';
import {theme} from "../src/components/general/Theme";
import { withTheme } from 'styled-components'
import i18n from "../src/translations/i18n";


export const decorators = [
  (Story) => {
    const StoryWithTheme = withTheme(Story);
    return (
      <ThemeProvider theme={theme}>
        <StoryWithTheme />
      </ThemeProvider>
  )},
];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}