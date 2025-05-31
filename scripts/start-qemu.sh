#!/bin/bash

# QEMU Macintosh Quadra 800 A/UX Emulation Startup Script
# Based on the provided command line configuration

set -e

# Configuration
QEMU_BIN="/usr/bin/qemu-system-m68k"
WORKSPACE_DIR="$(pwd)"
STORAGE_DIR="${WORKSPACE_DIR}/storage"
ROMS_DIR="${STORAGE_DIR}/roms"
DISKS_DIR="${STORAGE_DIR}/disks"
NVRAM_DIR="${STORAGE_DIR}/nvram"
CDROM_DIR="${STORAGE_DIR}/cdrom"
LOGS_DIR="${WORKSPACE_DIR}/logs"

# Default file paths
ROM_FILE="${ROMS_DIR}/q800.rom"
NVRAM_FILE="${NVRAM_DIR}/nvram.bin"
HDD_FILE="${DISKS_DIR}/scsi0.qcow2"
CDROM_FILE="${CDROM_DIR}/cdrom.iso"
BOOT_FLOPPY="${DISKS_DIR}/boot.img"

# QEMU configuration
MACHINE_NAME="Apple A/UX 3.0.1"
MEMORY="128"
MACHINE_TYPE="q800"
DISPLAY_MODE="sdl"
GRAPHICS_MODE="800x600x8"
NETWORK_MODEL="dp83932"

# Function to check if file exists
check_file() {
    local file_path="$1"
    local file_desc="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "ERROR: $file_desc not found at: $file_path"
        echo "Please ensure the file exists before starting emulation."
        return 1
    fi
    echo "Found $file_desc: $file_path"
}

# Function to create empty files if they don't exist
create_if_missing() {
    local file_path="$1"
    local file_desc="$2"
    local size="$3"
    
    if [ ! -f "$file_path" ]; then
        echo "Creating empty $file_desc: $file_path"
        if [ -n "$size" ]; then
            dd if=/dev/zero of="$file_path" bs=1 count="$size" 2>/dev/null
        else
            touch "$file_path"
        fi
    fi
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --install          Boot from floppy for installation"
    echo "  --boot-hdd         Boot from hard disk (normal operation)"
    echo "  --vnc              Use VNC display instead of SDL"
    echo "  --memory SIZE      Set memory size in MB (default: 128)"
    echo "  --help             Show this help message"
    echo ""
    echo "Files expected in storage directory:"
    echo "  roms/q800.rom      - Macintosh Quadra 800 ROM file"
    echo "  disks/scsi0.qcow2  - Main hard disk image"
    echo "  disks/boot.img     - Boot floppy image (for installation)"
    echo "  cdrom/cdrom.iso    - CD-ROM image"
    echo "  nvram/nvram.bin    - NVRAM file (created automatically)"
}

# Parse command line arguments
INSTALL_MODE=false
BOOT_MODE="hdd"
DISPLAY_TYPE="sdl"

while [[ $# -gt 0 ]]; do
    case $1 in
        --install)
            INSTALL_MODE=true
            BOOT_MODE="floppy"
            shift
            ;;
        --boot-hdd)
            BOOT_MODE="hdd"
            shift
            ;;
        --vnc)
            DISPLAY_TYPE="vnc"
            DISPLAY_MODE="vnc=:1"
            shift
            ;;
        --memory)
            MEMORY="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

echo "=========================================="
echo "QEMU Macintosh Quadra 800 A/UX Emulation"
echo "=========================================="
echo "Boot mode: $BOOT_MODE"
echo "Display: $DISPLAY_TYPE"
echo "Memory: ${MEMORY}MB"
echo ""

# Check for required files
echo "Checking required files..."

# ROM file is always required
if ! check_file "$ROM_FILE" "ROM file"; then
    echo ""
    echo "To obtain the ROM file:"
    echo "1. Extract q800.rom from a real Macintosh Quadra 800"
    echo "2. Use a ROM dumping utility"
    echo "3. Place the file at: $ROM_FILE"
    exit 1
fi

# Create NVRAM file if it doesn't exist
create_if_missing "$NVRAM_FILE" "NVRAM file" "8192"

# Check mode-specific files
if [ "$BOOT_MODE" = "floppy" ]; then
    if ! check_file "$BOOT_FLOPPY" "boot floppy image"; then
        echo ""
        echo "For installation mode, you need a boot floppy image."
        echo "This should be the A/UX installation floppy disk image."
        exit 1
    fi
fi

if [ "$BOOT_MODE" = "hdd" ]; then
    if ! check_file "$HDD_FILE" "hard disk image"; then
        echo ""
        echo "Creating empty hard disk image..."
        qemu-img create -f qcow2 "$HDD_FILE" 2G
        echo "Created: $HDD_FILE"
        echo ""
        echo "Note: You'll need to install A/UX first using --install mode"
    fi
fi

# CD-ROM is optional
if [ -f "$CDROM_FILE" ]; then
    echo "Found CD-ROM image: $CDROM_FILE"
    USE_CDROM=true
else
    echo "No CD-ROM image found (optional)"
    USE_CDROM=false
fi

echo ""
echo "Starting QEMU emulation..."
echo "Log file: ${LOGS_DIR}/qemu.log"

# Create log directory
mkdir -p "$LOGS_DIR"

# Build QEMU command
QEMU_CMD=(
    "$QEMU_BIN"
    -name "$MACHINE_NAME"
    -m "$MEMORY"
    -M "$MACHINE_TYPE"
    -display "$DISPLAY_MODE"
    -serial stdio
    -bios "$ROM_FILE"
    -g "$GRAPHICS_MODE"
    -net nic,model="$NETWORK_MODEL"
    -net user
    -drive file="$NVRAM_FILE",format=raw,if=mtd
)

# Add storage devices based on boot mode
if [ "$BOOT_MODE" = "floppy" ]; then
    # Installation mode: boot floppy as SCSI ID 0, HDD as SCSI ID 1
    QEMU_CMD+=(
        -device scsi-hd,scsi-id=0,drive=floppy0,vendor="APPLE",product="FLOPPY",ver="1.0"
        -drive file="$BOOT_FLOPPY",media=disk,format=raw,if=none,id=floppy0
    )
    
    if [ -f "$HDD_FILE" ]; then
        QEMU_CMD+=(
            -device scsi-hd,scsi-id=1,drive=hd0,vendor="SEAGATE",product="ST225N",ver="1.0"
            -drive file="$HDD_FILE",media=disk,format=qcow2,if=none,id=hd0
        )
    fi
else
    # Normal mode: HDD as SCSI ID 1
    QEMU_CMD+=(
        -device scsi-hd,scsi-id=1,drive=hd0,vendor="SEAGATE",product="ST225N",ver="1.0"
        -drive file="$HDD_FILE",media=disk,format=qcow2,if=none,id=hd0
    )
fi

# Add CD-ROM if available
if [ "$USE_CDROM" = true ]; then
    QEMU_CMD+=(
        -device scsi-cd,scsi-id=3,drive=cd0,vendor="MATSHITA",product="CD-ROM CR-8005",ver="1.0k"
        -drive file="$CDROM_FILE",format=raw,media=cdrom,if=none,id=cd0
    )
fi

echo "Command: ${QEMU_CMD[*]}"
echo ""

# Run QEMU and log output
exec "${QEMU_CMD[@]}" 2>&1 | tee "${LOGS_DIR}/qemu.log"
