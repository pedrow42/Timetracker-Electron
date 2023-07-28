const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    db: {
        getCardData: () =>
        {
            ipcRenderer.send('get-card-data');
        },
        onRecoveredCardData: (callback) =>
        {
            ipcRenderer.on('recovered-cards', (event, dados) =>
            {
                callback(dados);
            });
        },
        getTimeRecords: () =>
        {
            ipcRenderer.send('get-time-records');
        },
        onRetrievedTimeRecords: (callback) =>
        {
            ipcRenderer.on('retrieved-time-records', (event, dados) =>
            {
                callback(dados);
            });
        },
        registerCard: (activityName, cardName) =>
        {
            ipcRenderer.send('register-card', { activityName, cardName });
        },
        lastAddedCard: (callback) =>
        {
            ipcRenderer.on('last-added-card', (event, dados) =>
            {
                callback(dados);
            });
        },
        updateActivityData: (id, date, start, end, total) =>
        {
            ipcRenderer.send('update-activity-data', { id, date, start, end, total });
        },
        onLastAddedTime: (callback) =>
        {
            ipcRenderer.on('last-added-time', (event, id) =>
            {
                callback(id);
            });
        },
        deleteCard: (id) =>
        {
            ipcRenderer.send('delete-card', id);
        },
        deleteTime: (id) =>
        {
            ipcRenderer.send('delete-time', id);
        }
    },
    setTitle: (title) => ipcRenderer.send('set-title', title),
    closeApp: () => ipcRenderer.send('close-app'),
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    restaureApp: () => ipcRenderer.send('restaure-app'),
    onMaximizedApp: (callback) =>
    {
        ipcRenderer.on('is-maximized', () =>
        {
            callback();
        });
    },
    onRestauredApp: (callback) =>
    {
        ipcRenderer.on('is-restaured', () =>
        {
            callback();
        });
    }
});
