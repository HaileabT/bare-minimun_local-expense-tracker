#!/usr/bin/zsh

cd ..;

pnpm concurrently "pnpm dev" "wait-on http://localhost:8008 && xdg-open http://localhost:8008";
