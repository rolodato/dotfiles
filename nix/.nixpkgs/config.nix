{
  packageOverrides = defaultPkgs: with defaultPkgs; {
    rolodato = with pkgs; buildEnv {
      name = "rolodato";
      paths = [
        "coreutils"
        "curl"
        "ffmpeg"
        "git"
        "gnupg"
        "jq"
        "keychain"
        "nss-cacert"
        "oh-my-zsh-git-2016-04-20"
        "openssh-7"
        "pinentry"
        "stow"
        "vim"
        "wget"
        "zsh"
      ];
    };
  };
}
