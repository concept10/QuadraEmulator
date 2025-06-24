#!/bin/bash
# SPDX-FileCopyrightText: 2025 concept10
# SPDX-License-Identifier: MIT
# GitHub: https://github.com/concept10/qemu-aux-emulation

# Network bridge setup script for advanced QEMU networking

set -e

BRIDGE_NAME="br0"
TAP_INTERFACE="tap0"
BRIDGE_IP="192.168.100.1"
BRIDGE_NETMASK="255.255.255.0"
DHCP_RANGE_START="192.168.100.100"
DHCP_RANGE_END="192.168.100.200"

echo "Setting up network bridge for QEMU A/UX emulation..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root for network configuration."
    echo "Usage: sudo ./scripts/setup-bridge.sh"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install required packages if not present
install_bridge_utils() {
    echo "Installing bridge utilities..."
    if command_exists apt-get; then
        apt-get update
        DEBIAN_FRONTEND=noninteractive apt-get install -y bridge-utils iproute2 iptables dnsmasq
    elif command_exists yum; then
        yum install -y bridge-utils iproute2 iptables dnsmasq
    else
        echo "Package manager not supported. Please install bridge-utils, iproute2, iptables, and dnsmasq manually."
        exit 1
    fi
}

# Check and install required tools
for cmd in brctl ip iptables dnsmasq; do
    if ! command_exists "$cmd"; then
        echo "$cmd not found, installing bridge utilities..."
        install_bridge_utils
        break
    fi
done

# Stop existing bridge if it exists
if brctl show | grep -q "$BRIDGE_NAME"; then
    echo "Removing existing bridge $BRIDGE_NAME..."
    ip link set dev "$BRIDGE_NAME" down 2>/dev/null || true
    brctl delbr "$BRIDGE_NAME" 2>/dev/null || true
fi

# Remove existing TAP interface if it exists
if ip link show "$TAP_INTERFACE" >/dev/null 2>&1; then
    echo "Removing existing TAP interface $TAP_INTERFACE..."
    ip link delete "$TAP_INTERFACE" 2>/dev/null || true
fi

# Create bridge
echo "Creating bridge $BRIDGE_NAME..."
brctl addbr "$BRIDGE_NAME"
brctl stp "$BRIDGE_NAME" off
brctl setfd "$BRIDGE_NAME" 0

# Configure bridge IP
echo "Configuring bridge IP: $BRIDGE_IP/$BRIDGE_NETMASK..."
ip addr add "$BRIDGE_IP/24" dev "$BRIDGE_NAME"
ip link set dev "$BRIDGE_NAME" up

# Create TAP interface
echo "Creating TAP interface $TAP_INTERFACE..."
ip tuntap add dev "$TAP_INTERFACE" mode tap user "$(logname 2>/dev/null || echo $SUDO_USER || echo $USER)"
ip link set dev "$TAP_INTERFACE" up

# Add TAP to bridge
echo "Adding $TAP_INTERFACE to bridge $BRIDGE_NAME..."
brctl addif "$BRIDGE_NAME" "$TAP_INTERFACE"

# Enable IP forwarding
echo "Enabling IP forwarding..."
echo 1 > /proc/sys/net/ipv4/ip_forward

# Configure iptables for NAT
echo "Configuring iptables for NAT..."
iptables -t nat -A POSTROUTING -s 192.168.100.0/24 ! -d 192.168.100.0/24 -j MASQUERADE
iptables -A FORWARD -i "$BRIDGE_NAME" -o "$BRIDGE_NAME" -j ACCEPT
iptables -A FORWARD -i "$BRIDGE_NAME" -j ACCEPT
iptables -A FORWARD -o "$BRIDGE_NAME" -j ACCEPT

# Create dnsmasq configuration
DNSMASQ_CONF="/etc/dnsmasq.d/qemu-bridge.conf"
echo "Creating dnsmasq configuration at $DNSMASQ_CONF..."
cat > "$DNSMASQ_CONF" << EOF
# QEMU bridge DHCP configuration
interface=$BRIDGE_NAME
bind-interfaces
dhcp-range=$DHCP_RANGE_START,$DHCP_RANGE_END,12h
dhcp-option=3,$BRIDGE_IP
dhcp-option=6,$BRIDGE_IP
EOF

# Restart dnsmasq
echo "Restarting dnsmasq..."
systemctl restart dnsmasq 2>/dev/null || service dnsmasq restart 2>/dev/null || echo "Failed to restart dnsmasq service"

echo ""
echo "Bridge setup complete!"
echo ""
echo "Network Configuration:"
echo "  Bridge: $BRIDGE_NAME ($BRIDGE_IP/24)"
echo "  TAP Interface: $TAP_INTERFACE"
echo "  DHCP Range: $DHCP_RANGE_START - $DHCP_RANGE_END"
echo ""
echo "To use bridge networking with QEMU:"
echo "  ./scripts/start-qemu.sh --bridge"
echo ""
echo "To check bridge status:"
echo "  ./scripts/bridge-status.sh"
echo ""
echo "To remove bridge:"
echo "  sudo ./scripts/remove-bridge.sh"