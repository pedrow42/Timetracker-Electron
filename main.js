const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS activity_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    card TEXT,
    last_modification DATETIME
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS time_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    atividade_id INTEGER,
    date DATE,
    start TEXT,
    end TEXT,
    total TEXT
  )
`);

const createWindow = () =>
{
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 620,
        minHeight: 560,
        minWidth: 940,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'), // caminho para o arquivo de pré-carregamento
            backgroundThrottling: false
        },
    })

    ipcMain.on('close-app', () =>
    {
        mainWindow.close()
    })

    ipcMain.on('minimize-app', () =>
    {
        mainWindow.minimize();
    })

    ipcMain.on('restaure-app', (event) =>
    {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
            event.reply('is-maximized');
        } else {
            mainWindow.maximize();
            event.reply('is-restaured');
        }
    })

    mainWindow.loadFile('index.html')
}

function handleSetTitle(event, title)
{
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)

    const array = JSON.parse(title);

    // Cria uma nova planilha Excel
    const workbook = XLSX.utils.book_new();

    // Converte os dados em uma planilha
    const worksheet = XLSX.utils.aoa_to_sheet(array);

    // Adiciona a planilha ao arquivo Excel
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha1');

    // Salva o arquivo Excel
    const excelFilePath = path.join(app.getPath('documents'), 'minha-planilha.xlsx');
    XLSX.writeFile(workbook, excelFilePath);

    console.log('Planilha salva em: ' + excelFilePath);
}

app.whenReady().then(() =>
{
    ipcMain.on('set-title', handleSetTitle)
    createWindow()
})

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Método para recuperar os cards por ordem de modificação 
ipcMain.on('get-card-data', (event) =>
{
    db.all('SELECT * FROM activity_cards ORDER BY last_modification DESC', (err, rows) =>
    {
        if (err) {
            console.log(err.message);
            event.reply('recovered-cards', []);
        } else {
            event.reply('recovered-cards', rows);
        }
    });
});

// Método para recuperar o registro de marcações de tempo de cada card
ipcMain.on('get-time-records', (event) =>
{
    db.all('SELECT * FROM time_record', (err, rows) =>
    {
        if (err) {
            console.log(err.message);
            event.reply('retrieved-time-records', []);
        } else {
            event.reply('retrieved-time-records', rows);
        }
    });
});

// Cadastrar novo card
ipcMain.on('register-card', (event, args) =>
{
    const { activityName, cardName } = args
    db.run('INSERT INTO activity_cards (name, card) VALUES (?, ?)', [activityName, cardName], function (err)
    {
        if (err) {
            console.log(err.message);
        }
        db.all('SELECT * FROM activity_cards WHERE id = ?', this.lastID, function (err, rows)
        {
            if (err) {
                console.log(err.message);
            } else {
                event.reply('last-added-card', rows);
            }
        });

        console.log(`Nova atividade cadastrada com o ID ${this.lastID}`);
    });
});

// API para inserir dados
ipcMain.on('update-activity-data', (event, args) =>
{
    const { id, date, start, end, total } = args;
    db.run('INSERT INTO time_record (atividade_id, date, start, end, total) VALUES (?, ?, ?, ?, ?)',
        [id, date, start, end, total], function (err)
    {
        if (err) {
            console.log(err.message);
        } else {
            db.run('UPDATE activity_cards SET last_modification = datetime("now") WHERE id = ?', [id], function (error)
            {
                if (err) {
                    console.log(error)
                }
            })

            event.reply('last-added-time', this.lastID)
        }

    });
});

// Deletar uma marcação de tempo específica
ipcMain.on('delete-time', (event, id) =>
{
    db.run('DELETE FROM time_record WHERE id = ?', id, function (err)
    {
        if (err) {
            console.log(err.message);
        } else {
            console.log("excluído com sucesso!")
        }
    });
})

// Excluir um card e todos os seus respectivos registros de tempo
ipcMain.on('delete-card', (event, id) =>
{
    db.run('DELETE FROM activity_cards WHERE id = ?', id, function (err)
    {
        if (err) {
            console.log(err.message);
        } else {
            db.run('DELETE FROM time_record WHERE atividade_id = ?', id, function (errRegistro)
            {
                if (errRegistro) {
                    console.log(errRegistro.message);
                }
            });
        }
    });
});