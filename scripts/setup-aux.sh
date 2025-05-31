#!/bin/bash

# Setup script for A/UX emulation environment

set -e

WORKSPACE_DIR="$(pwd)"
STORAGE_DIR="${WORKSPACE_DIR}/storage"

echo "Setting up A/UX emulation environment..."

# Create storage directories
echo "Creating storage directories..."
mkdir -p "${STORAGE_DIR}/roms"
mkdir -p "${STORAGE_DIR}/disks"
mkdir -p "${STORAGE_DIR}/nvram"
mkdir -p "${STORAGE_DIR}/cdrom"
mkdir -p "${WORKSPACE_DIR}/logs"

# Set permissions
chmod 755 "${WORKSPACE_DIR}/scripts/"*.sh

echo "Creating empty disk images for testing..."

# Create a small test disk image if none exists (requires QEMU to be installed)
if command -v qemu-img >/dev/null 2>&1; then
    if [ ! -f "${STORAGE_DIR}/disks/test.qcow2" ]; then
        qemu-img create -f qcow2 "${STORAGE_DIR}/disks/test.qcow2" 100M
        echo "Created test disk image: ${STORAGE_DIR}/disks/test.qcow2"
    fi
else
    echo "Note: qemu-img not found. Install QEMU to create disk images."
    echo "In devcontainer: QEMU will be installed automatically"
fi

# Create README files in storage directories
cat > "${STORAGE_DIR}/roms/README.txt" << 'EOF'
ROM Files Directory
==================

Place your Macintosh Quadra 800 ROM file here:
- q800.rom (required)

ROM files can be obtained from:
1. Real Macintosh Quadra 800 hardware using ROM dumping utilities
2. Authorized ROM distribution sources

The ROM file should be exactly 1MB (1,048,576 bytes) in size.
EOF

cat > "${STORAGE_DIR}/disks/README.txt" << 'EOF'
Disk Images Directory
====================

Place your disk images here:
- scsi0.qcow2 - Main hard disk (will be created automatically)
- boot.img - Boot floppy for A/UX installation
- Any additional disk images

Supported formats:
- qcow2 (recommended for hard disks)
- raw (for floppy images)

Create new disk images with:
qemu-img create -f qcow2 filename.qcow2 SIZE
EOF

cat > "${STORAGE_DIR}/cdrom/README.txt" << 'EOF'
CD-ROM Images Directory
======================

Place your CD-ROM images here:
- cdrom.iso - Main CD-ROM image
- Any additional ISO images

Supported formats:
- ISO 9660 (.iso)
- Raw CD images (.bin/.cue)

A/UX installation CDs and software CDs should be placed here.
EOF

cat > "${STORAGE_DIR}/nvram/README.txt" << 'EOF'
NVRAM Directory
==============

This directory contains non-volatile RAM files:
- nvram.bin - System NVRAM (created automatically)

NVRAM stores system settings and configuration.
The file will be created automatically when first starting QEMU.
EOF

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Place your q800.rom file in: ${STORAGE_DIR}/roms/"
echo "2. Place your A/UX installation floppy in: ${STORAGE_DIR}/disks/boot.img"
echo "3. Run: ./scripts/start-qemu.sh --install"
echo ""
echo "For more information, see docs/SETUP.md"
