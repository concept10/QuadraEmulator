<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
-->

# QEMU Macintosh Quadra 800 A/UX Emulation Project

## Overview
Complete devcontainer environment for emulating a Macintosh Quadra 800 running Apple A/UX (Apple UNIX) using QEMU. The project includes automated setup scripts, proper directory structure, and comprehensive documentation.

## Project Architecture
- **Devcontainer**: Ubuntu 22.04 base with QEMU m68k system emulation
- **Storage Structure**: Organized directories for ROMs, disk images, NVRAM, and CD-ROMs
- **Scripts**: Automated setup and QEMU startup with installation/boot modes
- **Networking**: Dual mode support - user networking (default) and bridge networking (advanced)
  - User networking: Simple NAT, no root required
  - Bridge networking: TAP interface br0, DHCP range 192.168.100.100-200, full bidirectional access
- **GUI Interface**: Web-based management interface with real-time monitoring and control
  - System control panel for QEMU management
  - Network configuration and monitoring
  - File upload and management system
  - Live configuration editing
  - WebSocket-based real-time updates
- **Documentation**: Complete setup guides, networking configuration, troubleshooting, and practical examples

## Recent Changes
- 2025-05-31: Initial project creation with complete devcontainer setup
- 2025-05-31: Added MIT license and SPDX headers to all project files
- 2025-05-31: Created storage directory structure with helpful README files
- 2025-05-31: Added GitHub repository link to license and all project files
- 2025-05-31: Implemented advanced bridge networking configuration with TAP interfaces
- 2025-05-31: Added web-based GUI management interface with real-time monitoring

## User Preferences
None specified yet.

## License
MIT License (c) 2025 concept10
GitHub Repository: https://github.com/concept10/qemu-aux-emulation
All files include SPDX copyright and license identifiers with GitHub repository link.