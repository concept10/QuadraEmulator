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
