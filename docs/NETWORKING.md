<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# Network Configuration Guide

This guide covers the networking options available for the QEMU Macintosh Quadra 800 A/UX emulation.

## Network Modes

### 1. User Networking (Default)

User networking is the simplest mode and works without root privileges. It provides NAT-style connectivity.

**Features:**
- No root privileges required
- Automatic DHCP configuration
- Internet access via NAT
- Limited to outgoing connections only

**Usage:**
```bash
./scripts/start-qemu.sh --boot-hdd
# or explicitly:
./scripts/start-qemu.sh --boot-hdd --user-net
```

**Configuration:**
- Guest IP: Assigned by QEMU (typically 10.0.2.15)
- Gateway: 10.0.2.2
- DNS: 10.0.2.3

### 2. Bridge Networking (Advanced)

Bridge networking provides full network connectivity with the ability to run services accessible from the host network.

**Features:**
- Full bidirectional network access
- Guest appears as separate machine on network
- Can run servers accessible from host
- DHCP server provides IP addresses
- Better performance than user networking

**Requirements:**
- Root privileges for setup
- Bridge utilities (installed automatically)
- TAP/TUN support in kernel

## Bridge Network Setup

### Initial Setup

1. **Configure the bridge network:**
   ```bash
   sudo ./scripts/setup-bridge.sh
   ```

2. **Start QEMU with bridge networking:**
   ```bash
   ./scripts/start-qemu.sh --bridge --boot-hdd
   ```

### Bridge Network Details

**Network Configuration:**
- Bridge Interface: `br0`
- Bridge IP: `192.168.100.1/24`
- TAP Interface: `tap0`
- DHCP Range: `192.168.100.100` - `192.168.100.200`
- DNS Server: `192.168.100.1`

**Services:**
- DHCP: Provided by dnsmasq
- NAT: iptables rules for internet access
- DNS: dnsmasq forwarding to system DNS

### Managing Bridge Network

**Check bridge status:**
```bash
./scripts/bridge-status.sh
```

**Remove bridge configuration:**
```bash
sudo ./scripts/remove-bridge.sh
```

**Restart bridge services:**
```bash
sudo systemctl restart dnsmasq
```

## A/UX Network Configuration

### Automatic Configuration (DHCP)

When using either networking mode, A/UX should automatically receive network configuration via DHCP.

**In A/UX:**
1. The system should detect the Ethernet interface automatically
2. Network configuration is typically handled by the system startup scripts
3. Use `ifconfig` to verify network interface status

### Manual Configuration

If automatic configuration fails, you can manually configure networking in A/UX:

**Check network interface:**
```bash
# In A/UX terminal
ifconfig -a
```

**Configure interface manually (example):**
```bash
# For user networking:
ifconfig en0 10.0.2.15 netmask 255.255.255.0
route add default 10.0.2.2

# For bridge networking:
ifconfig en0 192.168.100.150 netmask 255.255.255.0
route add default 192.168.100.1
```

## Troubleshooting

### Bridge Network Issues

**Bridge not created:**
```bash
# Check if bridge utilities are installed
which brctl
# If not found, install manually:
sudo apt-get install bridge-utils
```

**Permission denied errors:**
```bash
# Ensure scripts are run with sudo for bridge setup
sudo ./scripts/setup-bridge.sh
```

**TAP interface not accessible:**
```bash
# Check TAP interface ownership
ls -la /dev/net/tun
# Ensure user has access to TAP device
```

**No DHCP in guest:**
```bash
# Check dnsmasq status
sudo systemctl status dnsmasq
# Check configuration
cat /etc/dnsmasq.d/qemu-bridge.conf
```

### Network Connectivity Issues

**No internet access:**
```bash
# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward
# Should show: 1

# Check iptables NAT rules
sudo iptables -t nat -L POSTROUTING
```

**Guest not receiving IP:**
```bash
# Check DHCP leases
sudo cat /var/lib/dnsmasq/dnsmasq.leases
# Or check dnsmasq logs
sudo journalctl -u dnsmasq -f
```

### A/UX Network Issues

**Network interface not detected:**
1. Verify QEMU is using correct network device model (dp83932)
2. Check A/UX network driver configuration
3. Restart networking services in A/UX

**Slow network performance:**
1. Consider using bridge networking instead of user networking
2. Check for packet loss with ping tests
3. Verify MTU settings

## Security Considerations

### Bridge Networking Security

**Firewall Rules:**
The bridge setup includes basic iptables rules. Consider additional security:

```bash
# Block unwanted traffic to bridge network
sudo iptables -A FORWARD -d 192.168.100.0/24 -p tcp --dport 22 -j DROP
```

**Network Isolation:**
Bridge networking provides network access. Consider:
- Running on isolated network segments
- Using VPN for sensitive operations
- Regular security updates for A/UX

### User Networking Security

User networking is more secure by default as it only allows outgoing connections, but still consider:
- Regular A/UX system updates
- Careful with file sharing between host and guest
- Monitor network usage

## Advanced Configuration

### Custom Bridge Configuration

You can modify the bridge setup by editing variables in `scripts/setup-bridge.sh`:

```bash
BRIDGE_NAME="br0"           # Bridge interface name
TAP_INTERFACE="tap0"        # TAP interface name
BRIDGE_IP="192.168.100.1"   # Bridge IP address
DHCP_RANGE_START="192.168.100.100"  # DHCP range start
DHCP_RANGE_END="192.168.100.200"    # DHCP range end
```

### Multiple TAP Interfaces

For running multiple QEMU instances:

```bash
# Create additional TAP interfaces
sudo ip tuntap add dev tap1 mode tap user $USER
sudo brctl addif br0 tap1
sudo ip link set dev tap1 up
```

### Port Forwarding with User Networking

Add port forwarding to user networking mode:

```bash
# Example: Forward host port 2222 to guest port 22
-net user,hostfwd=tcp::2222-:22
```

## Performance Optimization

### Network Performance Tips

1. **Use bridge networking** for better performance
2. **Increase network buffer sizes** in QEMU if needed
3. **Use virtio-net** if supported (experimental for m68k)
4. **Monitor network statistics** with host tools

### Monitoring Network Usage

**On host:**
```bash
# Monitor bridge traffic
sudo iftop -i br0

# Check network statistics
cat /proc/net/dev
```

**In A/UX:**
```bash
# Monitor network interfaces
netstat -i

# Check network connections
netstat -an
```