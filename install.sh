#/bin/sh

set -e

if [ -d "/nix" ]; then
  echo "Nix already installed, skipping download"
else
  echo "Downloading and installing Nix..."
  curl https://nixos.org/nix/install | sh
fi

echo "Installing bootstrap dependencies..."
nix-env -i git stow
echo "Dependencies installed. Copying dotfiles."
stow git gpg nix vim vscode zsh
echo "Dotfiles copied. Installing everything else..."
nix-env -i rolodato
