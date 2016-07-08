export GPG_TTY=$(tty)
source ~/.nix-profile/etc/profile.d/nix.sh
eval $(keychain --eval --agents ssh id_rsa)
