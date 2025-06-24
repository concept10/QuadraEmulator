<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# QEMU A/UX GUI Management Interface

Web-based management interface for controlling QEMU Macintosh Quadra 800 A/UX emulation.

## Features

- **System Control**: Start/stop QEMU with configurable options
- **Real-time Status**: WebSocket-based live system monitoring
- **Network Management**: Bridge network setup and configuration
- **File Management**: Upload and manage ROM files, disk images, and CD-ROMs
- **Configuration Editor**: Edit QEMU configuration files
- **Live Logging**: Real-time system log display

## Quick Start

### Using the Workflow (Recommended)
The GUI server starts automatically via the configured workflow on port 5000.

### Manual Start
```bash
cd gui
npm install
npm start
```

## Interface Components

### System Control Panel
- Boot mode selection (Installation/Normal)
- Network mode (User/Bridge)
- Display options (SDL/VNC)
- Memory configuration
- Start/Stop controls

### System Status Panel
- Current system state
- Uptime monitoring
- Configuration display
- Real-time updates

### Network Management Panel
- Bridge network setup/removal
- Network status monitoring
- Configuration validation

### File Management Panel
- Upload ROM files, disk images, CD-ROMs
- File browser with size/date information
- Delete unwanted files
- Organized by category

### Configuration Panel
- Edit QEMU configuration files
- Save/reload configuration
- Syntax highlighting

### Live Log Panel
- Real-time system logging
- Operation history
- Clear log functionality

## API Endpoints

### System Control
- `GET /api/status` - Get system status
- `POST /api/start` - Start QEMU
- `POST /api/stop` - Stop QEMU

### Configuration
- `GET /api/config` - Get configuration
- `POST /api/config` - Save configuration

### Network Management
- `POST /api/bridge/setup` - Setup bridge network
- `POST /api/bridge/remove` - Remove bridge network
- `GET /api/bridge/status` - Check bridge status

### File Management
- `POST /api/upload` - Upload files
- `DELETE /api/files/:category/:filename` - Delete files

## WebSocket Events

The interface uses WebSocket for real-time updates:

```javascript
{
  "type": "status",
  "data": {
    "running": true,
    "mode": "boot-hdd",
    "networkMode": "bridge",
    "uptime": 120000,
    "storage": { ... }
  }
}
```

## Security Considerations

- Bridge network operations require sudo privileges
- File uploads are restricted to storage directories
- Configuration changes affect QEMU behavior
- Network operations can modify system settings

## Development

### Dependencies
- Express.js - Web server
- WebSocket - Real-time communication
- Multer - File upload handling

### File Structure
```
gui/
├── server.js          # Main server application
├── package.json       # Dependencies and scripts
├── start-gui.sh       # Startup script
└── public/            # Static web assets
    ├── index.html     # Main interface
    ├── style.css      # Styling
    └── app.js         # Client-side JavaScript
```

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Permission Errors
Bridge network operations require root privileges:
```bash
sudo ./scripts/setup-bridge.sh
```

### WebSocket Connection Issues
- Check firewall settings
- Verify server is running on 0.0.0.0
- Check browser console for errors

### File Upload Issues
- Verify storage directories exist
- Check file permissions
- Ensure adequate disk space

## Integration

The GUI integrates with existing QEMU A/UX scripts:
- Uses `scripts/start-qemu.sh` for system control
- Manages `storage/` directories for files
- Edits `config/qemu-aux.conf` for configuration
- Executes bridge network scripts

Access the interface at: http://localhost:5000