source ~/.nix-profile/etc/profile.d/nix.sh
eval $(keychain --agents gpg --eval)
export GPG_TTY=$(tty)
