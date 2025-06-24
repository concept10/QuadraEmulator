<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# Setup Guide for A/UX Emulation

This guide provides detailed instructions for setting up and running Apple A/UX on the emulated Macintosh Quadra 800.

## Prerequisites

### Required Files

Before starting, you need to obtain these files legally:

1. **Macintosh Quadra 800 ROM** (`q800.rom`)
   - Size: 1,048,576 bytes (1MB)
   - Location: `storage/roms/q800.rom`
   - Source: Extract from real Quadra 800 hardware

2. **A/UX Installation Floppy** (`boot.img`)
   - A/UX 3.0.1 boot disk image
   - Location: `storage/disks/boot.img`
   - Format: Raw floppy disk image

3. **A/UX Installation CD-ROM** (`cdrom.iso`)
   - Complete A/UX 3.0.1 installation media
   - Location: `storage/cdrom/cdrom.iso`
   - Format: ISO 9660 or raw CD image

## Step-by-Step Installation

### 1. Prepare the Environment

Open the project in VS Code with Dev Containers extension. The container will automatically:
- Install QEMU with m68k support
- Create necessary directories
- Set up permissions

### 2. Place Required Files

```bash
# Copy ROM file
cp /path/to/your/q800.rom storage/roms/

# Copy A/UX installation media
cp /path/to/aux_boot.img storage/disks/boot.img
cp /path/to/aux_install.iso storage/cdrom/cdrom.iso
