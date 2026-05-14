FROM mcr.microsoft.com/devcontainers/universal:2

# ── Fix broken Yarn APT repo BEFORE features run apt-get update ──────────
# The universal:2 image has an outdated Yarn GPG key (NO_PUBKEY 62D54FD4003F6525)
# This causes ALL features that run apt-get update to fail.
# We must remove it here in the Dockerfile so the base image is clean.
RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && rm -f /etc/apt/sources.list.d/yarn.list.save \
    && apt-get update -qq \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
