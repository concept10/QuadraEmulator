// SPDX-FileCopyrightText: 2025 concept10
// SPDX-License-Identifier: MIT
// GitHub: https://github.com/concept10/qemu-aux-emulation

class QEMUManagerApp {
  constructor() {
    this.ws = null;
    this.systemStatus = null;
    this.init();
  }

  init() {
    this.setupWebSocket();
    this.setupEventListeners();
    this.loadInitialData();
    this.updateStatus();
  }

  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'status') {
        this.updateSystemStatus(message.data);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => this.setupWebSocket(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  setupEventListeners() {
    // System control buttons
    document.getElementById('startBtn').addEventListener('click', () => this.startQEMU());
    document.getElementById('stopBtn').addEventListener('click', () => this.stopQEMU());
    
    // Network management buttons
    document.getElementById('setupBridgeBtn').addEventListener('click', () => this.setupBridge());
    document.getElementById('removeBridgeBtn').addEventListener('click', () => this.removeBridge());
    document.getElementById('bridgeStatusBtn').addEventListener('click', () => this.checkBridgeStatus());
    
    // File management
    document.getElementById('uploadBtn').addEventListener('click', () => this.uploadFile());
    
    // Configuration management
    document.getElementById('loadConfigBtn').addEventListener('click', () => this.loadConfig());
    document.getElementById('saveConfigBtn').addEventListener('click', () => this.saveConfig());
    
    // Log management
    document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
    
    // Network mode change handler
    document.getElementById('networkMode').addEventListener('change', (e) => {
      if (e.target.value === 'bridge') {
        this.checkBridgeStatus();
      }
    });
  }

  async loadInitialData() {
    await this.updateStatus();
    await this.loadConfig();
    await this.updateFileList();
  }

  async updateStatus() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      this.updateSystemStatus(status);
    } catch (error) {
      console.error('Failed to fetch status:', error);
      this.showNotification('Failed to fetch system status', 'error');
    }
  }

  updateSystemStatus(status) {
    this.systemStatus = status;
    
    // Update status indicator
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (status.running) {
      statusDot.className = 'status-dot running';
      statusText.textContent = 'QEMU Running';
    } else {
      statusDot.className = 'status-dot stopped';
      statusText.textContent = 'QEMU Stopped';
    }
    
    // Update system status panel
    document.getElementById('systemStatus').textContent = status.running ? 'Running' : 'Stopped';
    document.getElementById('systemUptime').textContent = status.running ? 
      this.formatUptime(status.uptime) : '--';
    document.getElementById('currentMode').textContent = status.mode || '--';
    document.getElementById('currentNetwork').textContent = status.networkMode || '--';
    document.getElementById('currentMemory').textContent = status.memory ? `${status.memory}MB` : '--';
    
    // Update bridge status
    document.getElementById('bridgeStatus').textContent = 
      status.bridgeConfigured ? 'Configured' : 'Not Configured';
    
    // Update control buttons
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    startBtn.disabled = status.running;
    stopBtn.disabled = !status.running;
    
    // Update file lists
    if (status.storage) {
      this.updateFileDisplay(status.storage);
    }
  }

  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async startQEMU() {
    const config = {
      mode: document.getElementById('bootMode').value,
      networkMode: document.getElementById('networkMode').value,
      display: document.getElementById('displayMode').value,
      memory: parseInt(document.getElementById('memorySize').value)
    };
    
    // Validate bridge network if selected
    if (config.networkMode === 'bridge' && !this.systemStatus.bridgeConfigured) {
      this.showNotification('Bridge network not configured. Please set up bridge first.', 'warning');
      return;
    }
    
    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('QEMU started successfully', 'success');
        this.logMessage('QEMU started with configuration:', config);
      } else {
        this.showNotification(result.error || 'Failed to start QEMU', 'error');
        this.logMessage('Failed to start QEMU:', result.error);
      }
    } catch (error) {
      console.error('Start QEMU error:', error);
      this.showNotification('Failed to start QEMU', 'error');
      this.logMessage('Start QEMU error:', error.message);
    }
  }

  async stopQEMU() {
    try {
      const response = await fetch('/api/stop', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('QEMU stop signal sent', 'info');
        this.logMessage('QEMU stop signal sent');
      } else {
        this.showNotification(result.error || 'Failed to stop QEMU', 'error');
        this.logMessage('Failed to stop QEMU:', result.error);
      }
    } catch (error) {
      console.error('Stop QEMU error:', error);
      this.showNotification('Failed to stop QEMU', 'error');
      this.logMessage('Stop QEMU error:', error.message);
    }
  }

  async setupBridge() {
    try {
      const response = await fetch('/api/bridge/setup', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Bridge setup completed', 'success');
        this.showOutput('bridgeOutput', result.output);
        this.logMessage('Bridge setup completed');
      } else {
        this.showNotification(result.error || 'Failed to setup bridge', 'error');
        this.logMessage('Bridge setup failed:', result.error);
      }
    } catch (error) {
      console.error('Bridge setup error:', error);
      this.showNotification('Failed to setup bridge', 'error');
      this.logMessage('Bridge setup error:', error.message);
    }
  }

  async removeBridge() {
    if (!confirm('Are you sure you want to remove the bridge network configuration?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/bridge/remove', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Bridge removed successfully', 'success');
        this.showOutput('bridgeOutput', result.output);
        this.logMessage('Bridge removed successfully');
      } else {
        this.showNotification(result.error || 'Failed to remove bridge', 'error');
        this.logMessage('Bridge removal failed:', result.error);
      }
    } catch (error) {
      console.error('Bridge removal error:', error);
      this.showNotification('Failed to remove bridge', 'error');
      this.logMessage('Bridge removal error:', error.message);
    }
  }

  async checkBridgeStatus() {
    try {
      const response = await fetch('/api/bridge/status');
      const result = await response.json();
      
      this.showOutput('bridgeOutput', result.output);
      this.logMessage('Bridge status checked');
    } catch (error) {
      console.error('Bridge status error:', error);
      this.showNotification('Failed to check bridge status', 'error');
      this.logMessage('Bridge status error:', error.message);
    }
  }

  async uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const category = document.getElementById('fileCategory').value;
    
    if (!fileInput.files[0]) {
      this.showNotification('Please select a file to upload', 'warning');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('category', category);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('File uploaded successfully', 'success');
        this.logMessage('File uploaded:', result.file);
        fileInput.value = '';
        this.updateFileList();
      } else {
        this.showNotification(result.error || 'Failed to upload file', 'error');
        this.logMessage('File upload failed:', result.error);
      }
    } catch (error) {
      console.error('File upload error:', error);
      this.showNotification('Failed to upload file', 'error');
      this.logMessage('File upload error:', error.message);
    }
  }

  async deleteFile(category, filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${category}/${filename}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('File deleted successfully', 'success');
        this.logMessage('File deleted:', filename);
        this.updateFileList();
      } else {
        this.showNotification(result.error || 'Failed to delete file', 'error');
        this.logMessage('File deletion failed:', result.error);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      this.showNotification('Failed to delete file', 'error');
      this.logMessage('File deletion error:', error.message);
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/config');
      const result = await response.json();
      
      if (result.config) {
        document.getElementById('configEditor').value = result.config;
        this.logMessage('Configuration loaded');
      } else {
        this.showNotification('Failed to load configuration', 'error');
      }
    } catch (error) {
      console.error('Load config error:', error);
      this.showNotification('Failed to load configuration', 'error');
      this.logMessage('Load config error:', error.message);
    }
  }

  async saveConfig() {
    const config = document.getElementById('configEditor').value;
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Configuration saved successfully', 'success');
        this.logMessage('Configuration saved');
      } else {
        this.showNotification('Failed to save configuration', 'error');
        this.logMessage('Save config failed:', result.error);
      }
    } catch (error) {
      console.error('Save config error:', error);
      this.showNotification('Failed to save configuration', 'error');
      this.logMessage('Save config error:', error.message);
    }
  }

  async updateFileList() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      
      if (status.storage) {
        this.updateFileDisplay(status.storage);
      }
    } catch (error) {
      console.error('Update file list error:', error);
    }
  }

  updateFileDisplay(storage) {
    const fileListIds = {
      roms: 'romFiles',
      disks: 'diskFiles',
      cdrom: 'cdromFiles'
    };
    
    Object.entries(fileListIds).forEach(([category, elementId]) => {
      const container = document.getElementById(elementId);
      container.innerHTML = '';
      
      if (storage[category] && storage[category].length > 0) {
        storage[category].forEach(file => {
          const fileItem = this.createFileItem(category, file);
          container.appendChild(fileItem);
        });
      } else {
        container.innerHTML = '<div style="padding: 12px; color: #64748b; text-align: center;">No files</div>';
      }
    });
  }

  createFileItem(category, file) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const fileSize = this.formatFileSize(file.size);
    const fileDate = new Date(file.modified).toLocaleDateString();
    
    item.innerHTML = `
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${fileSize} • ${fileDate}</div>
      </div>
      <div class="file-actions">
        <button class="btn btn-danger btn-small" onclick="app.deleteFile('${category}', '${file.name}')">
          Delete
        </button>
      </div>
    `;
    
    return item;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showOutput(elementId, content) {
    const element = document.getElementById(elementId);
    element.textContent = content;
    element.style.display = 'block';
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }

  logMessage(message, data = null) {
    const logArea = document.getElementById('logOutput');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    if (data) {
      logArea.textContent += logEntry + '\n' + JSON.stringify(data, null, 2) + '\n\n';
    } else {
      logArea.textContent += logEntry + '\n';
    }
    
    logArea.scrollTop = logArea.scrollHeight;
  }

  clearLog() {
    document.getElementById('logOutput').textContent = '';
    this.logMessage('Log cleared');
  }
}

// Initialize the application
const app = new QEMUManagerApp();