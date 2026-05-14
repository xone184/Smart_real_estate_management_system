FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update & install base tools
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20 via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && echo "Node: $(node -v) | npm: $(npm -v)" \
    && rm -rf /var/lib/apt/lists/*

# PHP 8.1 + extensions (available in Ubuntu 22.04 without extra PPA)
RUN apt-get update && apt-get install -y \
       php8.1-cli \
       php8.1-mysql \
       php8.1-mbstring \
       php8.1-xml \
       php8.1-curl \
       php8.1-zip \
       php8.1-gd \
    && echo "PHP: $(php -v | head -1)" \
    && rm -rf /var/lib/apt/lists/*

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# MySQL Server
RUN apt-get update && apt-get install -y mysql-server \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspaces
