# Just Another Simple CRUD Expense Tracker
I made this simple app for personal use and if you are interested and want to try it out.
1. Clone it
```bash
git clone https://github.com/HaileabT/bare-minimun_local-expense-tracker <destination> && cd <destination>
```
2. Install dependancies
```bash
pnpm i
```
3. Add database file to environment config
```bash
DB_FILE_NAME=file:<filepath>.db
```
4. Run
```bash
pnpm dev
```

#### If you want to set up an alias to open the app when on zsh, do this (tested only on gnome)
1. Make `start.sh` executable
```bash
chmod +x scripts/start.sh
```
2. Add the following to your zsh config
```bash
alias expense="zsh <repo-dir>/scripts/start.sh"
```
3. Refresh zsh
```bash
zsh
```
