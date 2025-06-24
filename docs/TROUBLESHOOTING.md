<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# Troubleshooting Guide

This guide covers common issues and solutions for the A/UX emulation environment.

## Common Issues

### 1. QEMU Fails to Start

#### Error: "Could not open ROM file"

**Problem**: ROM file not found or incorrect path.

**Solution**:
```bash
# Check if ROM file exists
ls -la storage/roms/q800.rom

# Verify file size (should be 1,048,576 bytes)
stat storage/roms/q800.rom

# Check permissions
chmod 644 storage/roms/q800.rom
