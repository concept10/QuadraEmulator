#!/bin/bash
# SPDX-FileCopyrightText: 2025 concept10
# SPDX-License-Identifier: MIT
# GitHub: https://github.com/concept10/qemu-aux-emulation

# Remove network bridge configuration

set -e

BRIDGE_NAME="br0"
TAP_INTERFACE="tap0"

echo "Removing network bridge configuration..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root for network configuration."
    echo "Usage: sudo ./scripts/remove-bridge.sh"
    exit 1
fi

# Remove TAP from bridge if it exists
if brctl show | grep -q "$TAP_INTERFACE"; then
    echo "Removing $TAP_INTERFACE from bridge..."
    brctl delif "$BRIDGE_NAME" "$TAP_INTERFACE" 2>/dev/null || true
fi

# Remove TAP interface
if ip link show "$TAP_INTERFACE" >/dev/null 2>&1; then
    echo "Removing TAP interface $TAP_INTERFACE..."
    ip link set dev "$TAP_INTERFACE" down 2>/dev/null || true
    ip link delete "$TAP_INTERFACE" 2>/dev/null || true
fi

# Remove bridge
if brctl show | grep -q "$BRIDGE_NAME"; then
    echo "Removing bridge $BRIDGE_NAME..."
    ip link set dev "$BRIDGE_NAME" down 2>/dev/null || true
    brctl delbr "$BRIDGE_NAME" 2>/dev/null || true
fi

# Remove iptables rules
echo "Removing iptables rules..."
iptables -t nat -D POSTROUTING -s 192.168.100.0/24 ! -d 192.168.100.0/24 -j MASQUERADE 2>/dev/null || true
iptables -D FORWARD -i "$BRIDGE_NAME" -o "$BRIDGE_NAME" -j ACCEPT 2>/dev/null || true
iptables -D FORWARD -i "$BRIDGE_NAME" -j ACCEPT 2>/dev/null || true
iptables -D FORWARD -o "$BRIDGE_NAME" -j ACCEPT 2>/dev/null || true

# Remove dnsmasq configuration
DNSMASQ_CONF="/etc/dnsmasq.d/qemu-bridge.conf"
if [ -f "$DNSMASQ_CONF" ]; then
    echo "Removing dnsmasq configuration..."
    rm -f "$DNSMASQ_CONF"
    systemctl restart dnsmasq 2>/dev/null || service dnsmasq restart 2>/dev/null || echo "Failed to restart dnsmasq service"
fi

echo "Bridge configuration removed successfully!"