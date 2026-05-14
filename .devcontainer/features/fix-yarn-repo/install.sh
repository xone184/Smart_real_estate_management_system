#!/bin/bash
set -e

echo "=== Fixing broken Yarn APT repository ==="

# Remove broken Yarn repo (GPG key NO_PUBKEY 62D54FD4003F6525 expired in universal:2)
rm -f /etc/apt/sources.list.d/yarn.list
rm -f /etc/apt/sources.list.d/yarn.list.save

# Also remove from the new-style sources directory if present
rm -f /etc/apt/sources.list.d/yarn.sources

echo "Yarn repo removed. Running apt-get update..."
apt-get update -y

echo "=== Yarn repo fix complete ==="
