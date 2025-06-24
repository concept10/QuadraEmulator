<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# QEMU Macintosh Quadra 800 A/UX Emulation

Complete devcontainer environment for emulating a Macintosh Quadra 800 running Apple A/UX (Apple UNIX) using QEMU.

**GitHub Repository:** https://github.com/concept10/qemu-aux-emulation

## Features

- **Full Macintosh Quadra 800 emulation** with Motorola 68040 CPU
- **Dual networking modes**: Simple user networking and advanced bridge networking
- **Automated setup scripts** for easy deployment
- **Complete devcontainer** with all dependencies
- **Comprehensive documentation** and troubleshooting guides

## Quick Start

### 1. Setup Environment
```bash
# Initialize the environment
./scripts/setup-aux.sh
```

### 2. Choose Networking Mode

**Simple networking (recommended for beginners):**
```bash
./scripts/start-qemu.sh --install
```

**Advanced bridge networking (for development/services):**
```bash
# Setup bridge network (run once)
sudo ./scripts/setup-bridge.sh

# Start with bridge networking
./scripts/start-qemu.sh --install --bridge
```

### 3. Required Files
Place these files in the storage directories:
- `storage/roms/q800.rom` - Quadra 800 ROM file
- `storage/disks/boot.img` - A/UX installation floppy
- `storage/cdrom/cdrom.iso` - A/UX installation CD (optional)

## Networking Options

| Mode | Root Required | Features | Use Case |
|------|---------------|----------|----------|
| User (default) | No | NAT, outgoing only | Basic usage, testing |
| Bridge | Yes | Full network access, bidirectional | Development, services |

### Bridge Network Configuration
- Bridge IP: `192.168.100.1/24`
- DHCP Range: `192.168.100.100-200`
- TAP Interface: `tap0`
- Internet access via NAT

## Usage Examples

```bash
# Basic installation
./scripts/start-qemu.sh --install

# Boot installed system
./scripts/start-qemu.sh --boot-hdd

# Use VNC display
./scripts/start-qemu.sh --boot-hdd --vnc

# Bridge networking with more memory
./scripts/start-qemu.sh --boot-hdd --bridge --memory 256

# Check bridge network status
./scripts/bridge-status.sh

# Remove bridge network
sudo ./scripts/remove-bridge.sh
```

## Directory Structure

```
├── .devcontainer/          # VS Code devcontainer configuration
├── config/                 # QEMU configuration files
├── docs/                   # Documentation
│   ├── README.md          # This file
│   ├── SETUP.md           # Detailed setup guide
│   ├── NETWORKING.md      # Network configuration guide
│   ├── NETWORK-EXAMPLES.md # Practical examples
│   └── TROUBLESHOOTING.md # Common issues and solutions
├── scripts/               # Automation scripts
│   ├── setup-aux.sh      # Environment setup
│   ├── start-qemu.sh     # QEMU startup script
│   ├── setup-bridge.sh   # Bridge network setup
│   ├── remove-bridge.sh  # Bridge network removal
│   └── bridge-status.sh  # Network status check
└── storage/               # File storage
    ├── roms/             # ROM files
    ├── disks/            # Disk images
    ├── cdrom/            # CD-ROM images
    └── nvram/            # NVRAM files
```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed installation instructions
- **[Networking Guide](docs/NETWORKING.md)** - Complete networking configuration
- **[Network Examples](docs/NETWORK-EXAMPLES.md)** - Practical networking examples
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Requirements

### For Devcontainer
- VS Code with Dev Containers extension
- Docker Desktop

### For Bridge Networking
- Linux host with root access
- Bridge utilities (installed automatically)
- TAP/TUN kernel support

### A/UX Files (obtain legally)
- Macintosh Quadra 800 ROM (1MB)
- A/UX 3.0.1 installation media

## License

MIT License - Copyright (c) 2025 concept10

See [LICENSE](LICENSE) file for full license text.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper SPDX headers
4. Test with both networking modes
5. Submit pull request

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Review [NETWORKING.md](docs/NETWORKING.md) for network issues
- Open GitHub issue with detailed description

---

**Note:** Apple A/UX and Macintosh Quadra 800 ROM files must be obtained legally from original hardware or authorized sources.