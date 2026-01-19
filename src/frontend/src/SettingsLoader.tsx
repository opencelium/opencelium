import React, {FC, Suspense, useEffect, useState} from 'react';
import {isDev} from "@root/components/utils/constants/app";
import {Urls} from "@entity/application/requests/classes/url";
import Loading from '@app_component/base/loading/Loading';

const SettingsLoader = ({ children }: { children: React.ReactNode }) => {
    const [hasSettings, setHasSettings] = useState(false);

    useEffect(() => {
        const settingsFile = isDev ? '/settings_dev.json' : '/settings.json';
        fetch(settingsFile)
            .then((res) => res.json())
            .then((settings) => {
                const apiPort = settings.server.port;
                const socketPort = settings.socket.port;
                let { protocol, hostname } = window.location;

                const base = `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}`;
                const endpoint = settings?.server?.endpoint?.trim() || "/";
                Urls.baseUrl = `${base}${endpoint}`;
                Urls.baseUrlApi = `${base}${endpoint}`;

                const socketEndpoint = settings?.socket?.endpoint?.trim() || "";
                Urls.socketServer = `${protocol}//${hostname}:${socketPort}${socketEndpoint}`;

                setHasSettings(true);
            })
            .catch((error) => console.error("Error loading settings:", error));
    }, []);

    if (!hasSettings) return <Loading top={"20%"}/>;

    return <>{children}</>;
};

export default SettingsLoader;
