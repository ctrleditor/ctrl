{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              biome
              bun
              go
              gopls
              gotools
              rustup
              rust-analyzer
              tree-sitter
              typescript-language-server
              uv
            ];

            shellHook = ''
              export RUST_BACKTRACE=1

              if ! rustup toolchain list | grep -q stable; then
                rustup default stable
                rustup component add rustfmt clippy rust-src
              fi
            '';
          };
        }
      );
    };
}
