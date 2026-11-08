import { jsx as _jsx } from "react/jsx-runtime";
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/newsreader/wght-italic.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { registerOffline } from './lib/offline';
import { installSpeechUnlock } from './lib/speech';
import './styles.css';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
installSpeechUnlock();
if (import.meta.env.PROD)
    registerOffline();
