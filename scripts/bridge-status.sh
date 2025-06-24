#!/bin/bash
# SPDX-FileCopyrightText: 2025 concept10
# SPDX-License-Identifier: MIT
# GitHub: https://github.com/concept10/qemu-aux-emulation

# Display bridge network status

echo "=== Bridge Network Status ==="
echo
echo "Bridge interfaces:"
brctl show
echo
echo "Bridge IP configuration:"
ip addr show br0 2>/dev/null || echo "Bridge br0 not found"
echo
echo "TAP interface status:"
ip link show tap0 2>/dev/null || echo "TAP interface tap0 not found"
echo
echo "DHCP leases (if available):"
if [ -f /var/lib/dhcp/dhcpd.leases ]; then
    tail -10 /var/lib/dhcp/dhcpd.leases
elif [ -f /var/lib/dnsmasq/dnsmasq.leases ]; then
    cat /var/lib/dnsmasq/dnsmasq.leases
else
    echo "No DHCP lease file found"
fi
echo
echo "iptables NAT rules:"
iptables -t nat -L POSTROUTING | grep 192.168.100 || echo "No NAT rules found"