<!--
SPDX-FileCopyrightText: 2025 concept10
SPDX-License-Identifier: MIT
GitHub: https://github.com/concept10/qemu-aux-emulation
-->

# Network Configuration Examples

This document provides practical examples for configuring networking in the QEMU A/UX emulation environment.

## Quick Start Examples

### Basic User Networking (Default)

```bash
# Start with default user networking
./scripts/start-qemu.sh --boot-hdd

# Installation with user networking
./scripts/start-qemu.sh --install
```

### Bridge Networking Setup

```bash
# 1. Set up bridge network (run once)
sudo ./scripts/setup-bridge.sh

# 2. Start with bridge networking
./scripts/start-qemu.sh --boot-hdd --bridge

# 3. Check bridge status
./scripts/bridge-status.sh

# 4. Remove bridge when done (optional)
sudo ./scripts/remove-bridge.sh
```

## Advanced Bridge Configuration

### Custom IP Range

Edit `scripts/setup-bridge.sh` to customize the network:

```bash
BRIDGE_IP="10.0.10.1"
DHCP_RANGE_START="10.0.10.100"
DHCP_RANGE_END="10.0.10.200"
```

### Multiple QEMU Instances

For running multiple A/UX instances simultaneously:

```bash
# Create additional TAP interfaces
sudo ip tuntap add dev tap1 mode tap user $USER
sudo ip tuntap add dev tap2 mode tap user $USER

# Add to bridge
sudo brctl addif br0 tap1
sudo brctl addif br0 tap2
sudo ip link set dev tap1 up
sudo ip link set dev tap2 up

# Start instances with different TAP interfaces
./scripts/start-qemu.sh --bridge --tap-device tap1
./scripts/start-qemu.sh --bridge --tap-device tap2
```

## A/UX Network Configuration Examples

### Automatic DHCP Configuration

Most A/UX installations will automatically configure networking via DHCP:

```bash
# Check network interface in A/UX
ifconfig -a

# Typical output:
# en0: flags=863<UP,BROADCAST,NOTRAILERS,RUNNING>
#      inet 192.168.100.150 netmask 0xffffff00 broadcast 192.168.100.255
```

### Manual Network Configuration

If DHCP doesn't work, configure manually in A/UX:

```bash
# Configure IP address
ifconfig en0 192.168.100.150 netmask 255.255.255.0

# Add default route
route add default 192.168.100.1

# Add DNS (edit /etc/resolv.conf)
echo "nameserver 192.168.100.1" > /etc/resolv.conf

# Test connectivity
ping 192.168.100.1
ping 8.8.8.8
```

### Network Services in A/UX

#### SSH Server Setup

```bash
# Enable SSH daemon in A/UX (if available)
/etc/rc.d/sshd start

# Or configure telnet (more common in A/UX)
/etc/rc.d/telnetd start
```

#### File Transfer

```bash
# Using FTP
ftp 192.168.100.1

# Using rcp (if available)
rcp file.txt user@192.168.100.1:/path/

# Using tar over network
tar cf - files/ | rsh host 'cd /dest && tar xf -'
```

## Host Network Integration

### Accessing A/UX Services from Host

With bridge networking, services running in A/UX are accessible from the host:

```bash
# If A/UX is running telnet on 192.168.100.150
telnet 192.168.100.150

# If A/UX is running HTTP server
curl http://192.168.100.150/

# SSH to A/UX (if SSH server is configured)
ssh user@192.168.100.150
```

### Port Forwarding with User Networking

For user networking mode, use QEMU's built-in port forwarding:

```bash
# Add to QEMU command in start-qemu.sh
-net user,hostfwd=tcp::2222-:22,hostfwd=tcp::8080-:80

# Then access from host:
ssh -p 2222 user@localhost
curl http://localhost:8080/
```

## Troubleshooting Network Issues

### Bridge Network Problems

```bash
# Check bridge status
brctl show

# Check TAP interface
ip link show tap0

# Check bridge IP
ip addr show br0

# Test DHCP server
sudo systemctl status dnsmasq

# Check iptables rules
sudo iptables -t nat -L POSTROUTING
```

### A/UX Network Problems

```bash
# In A/UX: Check interface status
ifconfig -a

# Check routing table
netstat -rn

# Check network processes
ps aux | grep network

# Test connectivity
ping 192.168.100.1  # Bridge gateway
ping 8.8.8.8        # Internet connectivity
```

### Common Solutions

#### Problem: No IP Address in A/UX
```bash
# Solution 1: Restart networking in A/UX
/etc/rc.d/network restart

# Solution 2: Configure manually
ifconfig en0 up
dhclient en0

# Solution 3: Check DHCP server
sudo systemctl restart dnsmasq
```

#### Problem: No Internet Access
```bash
# Check IP forwarding on host
cat /proc/sys/net/ipv4/ip_forward
# Should show: 1

# Check NAT rules
sudo iptables -t nat -L POSTROUTING
```

#### Problem: Can't Access A/UX from Host
```bash
# Check A/UX firewall (if any)
# Check service is running in A/UX
netstat -an | grep LISTEN

# Check host firewall
sudo iptables -L
```

## Performance Optimization

### Network Performance Tips

1. **Use bridge networking** for better performance than user networking
2. **Disable unnecessary services** in A/UX to reduce network overhead
3. **Use appropriate MTU sizes**:
   ```bash
   # In A/UX, set MTU
   ifconfig en0 mtu 1500
   ```

### Monitoring Network Performance

```bash
# On host: Monitor bridge traffic
sudo tcpdump -i br0

# Monitor interface statistics
cat /proc/net/dev

# In A/UX: Monitor network usage
netstat -i
```

## Security Considerations

### Basic Security Setup

```bash
# Limit bridge network access
sudo iptables -A FORWARD -d 192.168.100.0/24 -p tcp --dport 22 -j DROP

# Monitor network connections
sudo netstat -an | grep 192.168.100
```

### A/UX Security

```bash
# In A/UX: Basic security measures
# Disable unnecessary services
# Change default passwords
# Configure proper file permissions
chmod 600 ~/.ssh/authorized_keys
```

## Integration Examples

### Development Workflow

```bash
# Start A/UX with bridge networking for development
sudo ./scripts/setup-bridge.sh
./scripts/start-qemu.sh --bridge --boot-hdd

# Transfer files to A/UX
scp file.c user@192.168.100.150:/home/user/

# Compile and test in A/UX
ssh user@192.168.100.150 "cd /home/user && cc -o program file.c"

# Run program in A/UX
ssh user@192.168.100.150 "/home/user/program"
```

### Backup and Restore

```bash
# Backup A/UX files to host
rsync -av user@192.168.100.150:/home/user/ ./backups/

# Restore files to A/UX
rsync -av ./backups/ user@192.168.100.150:/home/user/
```