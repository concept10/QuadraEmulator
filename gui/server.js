// SPDX-FileCopyrightText: 2025 concept10
// SPDX-License-Identifier: MIT
// GitHub: https://github.com/concept10/qemu-aux-emulation

const express = require('express');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'storage', req.body.category || 'disks');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Global state
let qemuProcess = null;
let systemStatus = {
  running: false,
  mode: 'stopped',
  networkMode: 'user',
  display: 'sdl',
  memory: 128,
  bridgeConfigured: false
};

// Utility functions
function getStorageInfo() {
  const storagePath = path.join(__dirname, '..', 'storage');
  const info = {
    roms: [],
    disks: [],
    cdrom: [],
    nvram: []
  };

  try {
    ['roms', 'disks', 'cdrom', 'nvram'].forEach(dir => {
      const dirPath = path.join(storagePath, dir);
      if (fs.existsSync(dirPath)) {
        info[dir] = fs.readdirSync(dirPath)
          .filter(file => !file.startsWith('.') && !file.endsWith('.txt'))
          .map(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              modified: stats.mtime
            };
          });
      }
    });
  } catch (error) {
    console.error('Error reading storage info:', error);
  }

  return info;
}

function checkBridgeStatus() {
  return new Promise((resolve) => {
    exec('brctl show | grep br0', (error, stdout) => {
      systemStatus.bridgeConfigured = !error && stdout.includes('br0');
      resolve(systemStatus.bridgeConfigured);
    });
  });
}

function getSystemStatus() {
  return {
    ...systemStatus,
    storage: getStorageInfo(),
    uptime: qemuProcess ? Date.now() - qemuProcess.startTime : 0
  };
}

// Routes
app.get('/api/status', async (req, res) => {
  await checkBridgeStatus();
  res.json(getSystemStatus());
});

app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'qemu-aux.conf');
    const config = fs.readFileSync(configPath, 'utf8');
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read config file' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'qemu-aux.conf');
    fs.writeFileSync(configPath, req.body.config);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config file' });
  }
});

app.post('/api/start', async (req, res) => {
  if (qemuProcess) {
    return res.status(400).json({ error: 'QEMU is already running' });
  }

  const { mode, networkMode, display, memory } = req.body;
  
  try {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'start-qemu.sh');
    const args = [];
    
    if (mode === 'install') args.push('--install');
    else args.push('--boot-hdd');
    
    if (networkMode === 'bridge') args.push('--bridge');
    if (display === 'vnc') args.push('--vnc');
    if (memory && memory !== 128) args.push('--memory', memory.toString());

    qemuProcess = spawn(scriptPath, args, {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    qemuProcess.startTime = Date.now();
    
    systemStatus.running = true;
    systemStatus.mode = mode;
    systemStatus.networkMode = networkMode;
    systemStatus.display = display;
    systemStatus.memory = memory;

    // Broadcast status update
    broadcastStatus();

    qemuProcess.on('exit', (code) => {
      systemStatus.running = false;
      systemStatus.mode = 'stopped';
      qemuProcess = null;
      broadcastStatus();
    });

    res.json({ success: true, message: 'QEMU started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start QEMU: ' + error.message });
  }
});

app.post('/api/stop', (req, res) => {
  if (!qemuProcess) {
    return res.status(400).json({ error: 'QEMU is not running' });
  }

  try {
    qemuProcess.kill('SIGTERM');
    res.json({ success: true, message: 'QEMU stop signal sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop QEMU: ' + error.message });
  }
});

app.post('/api/bridge/setup', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'setup-bridge.sh');
  
  exec(`sudo ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: 'Failed to setup bridge: ' + stderr });
    } else {
      checkBridgeStatus().then(() => {
        res.json({ success: true, message: 'Bridge setup completed', output: stdout });
      });
    }
  });
});

app.post('/api/bridge/remove', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'remove-bridge.sh');
  
  exec(`sudo ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: 'Failed to remove bridge: ' + stderr });
    } else {
      checkBridgeStatus().then(() => {
        res.json({ success: true, message: 'Bridge removed successfully', output: stdout });
      });
    }
  });
});

app.get('/api/bridge/status', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'bridge-status.sh');
  
  exec(scriptPath, (error, stdout, stderr) => {
    res.json({ 
      output: stdout || stderr,
      configured: systemStatus.bridgeConfigured 
    });
  });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({ 
    success: true, 
    message: `File uploaded to ${req.body.category}/${req.file.filename}`,
    file: {
      name: req.file.filename,
      size: req.file.size,
      category: req.body.category
    }
  });
});

app.delete('/api/files/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join(__dirname, '..', 'storage', category, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// WebSocket server for real-time updates
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send current status to new client
  ws.send(JSON.stringify({ type: 'status', data: getSystemStatus() }));
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcastStatus() {
  const status = getSystemStatus();
  const message = JSON.stringify({ type: 'status', data: status });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`QEMU A/UX GUI Server running on http://0.0.0.0:${PORT}`);
  console.log('WebSocket server ready for real-time updates');
});

// Initialize bridge status check
checkBridgeStatus();