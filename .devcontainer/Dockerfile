FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 20, PHP 8.2, MySQL
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    software-properties-common \
    && true

# Node.js 20 via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && echo "Node: $(node -v) | npm: $(npm -v)"

# PHP 8.2
RUN add-apt-repository ppa:ondrej/php -y \
    && apt-get update \
    && apt-get install -y \
       php8.2-cli \
       php8.2-mysql \
       php8.2-mbstring \
       php8.2-xml \
       php8.2-curl \
       php8.2-zip \
       php8.2-gd \
    && echo "PHP: $(php -v | head -1)"

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# MySQL Server
RUN apt-get install -y mysql-server \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspaces
