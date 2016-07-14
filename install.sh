#!/bin/sh

set -e

if [ -d "/nix" ]; then
  echo "Nix already installed, skipping download"
else
  echo "Downloading and installing Nix..."
  curl https://nixos.org/nix/install | sh
  source ~/.nix-profile/etc/profile.d/nix.sh
fi

echo "Installing dependencies..."
nix-env -i coreutils curl ffmpeg git jq keychain nss-cacert oh-my-zsh-git openssh pinentry stow vim wget zsh pwgen unrar jekyll
nix-env -iA nixpkgs.gnupg1
echo "Dependencies installed. Copying dotfiles."
stow git gpg nix vim vscode zsh
echo "Done! Restart this shell to finish."
