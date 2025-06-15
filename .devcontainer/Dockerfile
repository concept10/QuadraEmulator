FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    qemu-system-misc \
    qemu-utils \
    qemu-block-extra \
    libsdl2-dev \
    libsdl2-image-dev \
    wget \
    curl \
    unzip \
    git \
    build-essential \
    cmake \
    gdb \
    vim \
    nano \
    screen \
    tmux \
    htop \
    tree \
    file \
    socat \
    netcat \
    telnet \
    openssh-client \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create vscode user
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid vscode --shell /bin/bash --create-home vscode \
    && echo 'vscode ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Set up workspace
WORKDIR /workspace
RUN chown vscode:vscode /workspace

# Switch to vscode user
USER vscode

# Create necessary directories
RUN mkdir -p /workspace/storage/roms \
    && mkdir -p /workspace/storage/disks \
    && mkdir -p /workspace/storage/nvram \
    && mkdir -p /workspace/storage/cdrom \
    && mkdir -p /workspace/logs

# Set environment variables
ENV QEMU_SYSTEM_M68K=/usr/bin/qemu-system-m68k
ENV QEMU_AUDIO_DRV=none
ENV SDL_VIDEODRIVER=x11

# Expose ports for web interface and debugging
EXPOSE 5000 8000

CMD ["/bin/bash"]
