import { Trans } from 'react-i18next';
import React from 'react';

const AsciiError = () => {
    return (
        <Trans i18nKey="masterPassword.error.nonAsciiError" ns="widget">
            Password contains
            <a
                href="https://terpconnect.umd.edu/~zben/Web/CharSet/htmlchars.html"
                target="_blank"
                rel="noopener noreferrer"
            >
                non-ASCII
            </a>{' '}
            characters!
        </Trans>
    );
};

export default AsciiError;
