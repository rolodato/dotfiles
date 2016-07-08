# dotfiles

Uses [Nix](https://nixos.org/nix/) to handle dependencies and [GNU Stow](https://www.gnu.org/software/stow/) to manage dotfiles from a Git repository.

## Install

```sh
git clone git@github.com:rolodato/dotfiles.git ~/dotfiles && cd ~/dotfiles && ./install.sh
```

## Update

Add dependencies to [`config.nix`](/nix/.nixpkgs/config.nix) and run `nix-env -i rolodato` to install.
