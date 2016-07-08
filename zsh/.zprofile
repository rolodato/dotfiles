source ~/.nix-profile/etc/profile.d/nix.sh
eval $(keychain --eval --agents gpg --quiet)
export GPG_TTY=$(tty)
