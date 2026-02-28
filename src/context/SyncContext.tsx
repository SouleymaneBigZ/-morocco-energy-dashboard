"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SyncContextType {
    isLiveSyncEnabled: boolean;
    toggleLiveSync: () => void;
}

const SyncContext = createContext < SyncContextType | undefined > (undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const [isLiveSyncEnabled, setIsLiveSyncEnabled] = useState(true);

    const toggleLiveSync = () => {
        setIsLiveSyncEnabled((prev) => !prev);
    };

    return (
        <SyncContext.Provider value={{ isLiveSyncEnabled, toggleLiveSync }}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error("useSync must be used within a SyncProvider");
    }
    return context;
}
