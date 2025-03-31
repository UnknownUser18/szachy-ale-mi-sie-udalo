const express = require('express');
const { exec } = require('child_process');
const os = require('os');
const cors = require('cors');

const app = express();
app.use(cors());

let serverProcess = null;
const serverPath = `./index.js`;

function getLocalIPv4() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const iface of interfaceInfo) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

app.get('/start-server', (req, res) => {
    const localIPv4 = getLocalIPv4();
    if (serverProcess) {
        return res.status(200).send({
            pid: serverProcess.pid,
            ip: localIPv4,
            message: `Jednostka serwera została zainicjalizowana wcześniej. Aktualnie jest dostępny pod adresem: http://${localIPv4}:${port}`
        });
    }

    serverProcess = exec(`node ./index.js`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
    });


    res.send({
        pid: serverProcess.pid,
        ip: localIPv4, // Dodaj adres IP do odpowiedzi
        message: `Pomyślnie zainicjalizowano serwer. Aktualnie jest dostępny pod adresem: http://${localIPv4}:${port}`
    });
});

app.get('/stop-server', (req, res) => {
    if (!serverProcess) {
        return res.status(400).send({
            message: `Aktualnie serwer nie istnieje`,
            running: false
        });
    }

    serverProcess.kill();
    serverProcess = null;

    res.send({
        message: `Pomyślnie wyłączono serwer!`,
        running: false
    });
});

app.get('/server-status', (req, res) => {
    res.send({
        running: !!serverProcess,
        pid: serverProcess?.pid,
    });
});

const port = 2222;
app.listen(port, () => {
    const localIPv4 = getLocalIPv4();
    console.log(`System kontrolny serwera, aktualnie jest dostępny pod adresem: http://${localIPv4}:${port}`);
});