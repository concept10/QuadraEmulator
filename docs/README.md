<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# QEMU Macintosh Quadra 800 A/UX Emulation

This devcontainer provides a complete environment for emulating a Macintosh Quadra 800 running Apple A/UX (Apple UNIX) using QEMU.

**GitHub Repository:** https://github.com/concept10/qemu-aux-emulation

## Overview

Apple A/UX was Apple's implementation of UNIX System V Release 2.2 for Macintosh computers. This emulation environment allows you to run A/UX 3.0.1 on a virtual Macintosh Quadra 800.

## Features

- Full Macintosh Quadra 800 hardware emulation
- Motorola 68040 CPU emulation
- 128MB RAM (configurable)
- SCSI hard disk and CD-ROM support
- Ethernet networking via QEMU user networking
- Serial console for debugging
- SDL graphics display
- Persistent NVRAM storage

## Quick Start

1. **Open in VS Code with Dev Containers extension**
2. **Place required files in storage directory:**
   - `storage/roms/q800.rom` - Quadra 800 ROM file
   - `storage/disks/boot.img` - A/UX installation floppy
3. **Install A/UX:**
   ```bash
   ./scripts/start-qemu.sh --install
   ```
4. **Boot normally after installation:**
   ```bash
   ./scripts/start-qemu.sh --boot-hdd
   ```

## Directory Structure

