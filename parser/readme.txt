//--------------TLDR----------------//
To open PowerShell: 
Navigate to the scripts root folder directory (where parser.ts is located) 
click on the file explorer's address bar, type "PowerShell" press enter)

run:
irm https://deno.land/install.ps1 | iex
deno run --allow-read --allow-write parser.ts "PASTE PATH TO FULLGAME FOLDER HERE(no '/' at the end)" --gold (MIGHT TAKE 5-10min)
deno run --allow-read --allow-write parser.ts "PASTE PATH TO PB FOLDER HERE"

open splits.lss (will appear in the same folder as parser.ts)
//--------------TLDR----------------//



(NOTE: only works for /fullgame folder dir) 
(IMPORTANT NOTE: if you dont have deno installed, run "irm https://deno.land/install.ps1 | iex" in the PowerShell)

Extracting golds from fullgame folder:
(WARNING: feature implementation is an insane mess cuz im completely incompetent, check results before fetching)
deno run --allow-read --allow-write parser.ts "PASTE PATH TO FULLGAME FOLDER HERE" --gold
Run this once to extract your best splits from the entire fullgame/ history of your runs 
This will take a couple of minutes, depending on the amount of run folders you have (you can add --debug arg to see, what is happening)

Usage example: 
deno run --allow-read --allow-write parser.ts "D:\SteamLibrary\steamapps\common\Portal 2\portal2\demos\fullgame") --debug --gold

Fetching splits from selected PB folder:
deno run --allow-read --allow-write parser.ts "PASTE PATH TO PB FOLDER HERE"
Run this to parse demos from your pb folder 
Output is a splits.lss (live-split compatible) file that will fetch segment times from your pb, and gold splits from the first command

Usage example: 
deno run --allow-read --allow-write parser.ts "D:\SteamLibrary\steamapps\common\Portal 2\portal2\demos\fullgame\2025-09-21_19-59-37")


Args:
[--gold] - scan fullgame folder recursively to find best segments
[--debug] - debug log
[--max-size X Mb] - skip all demos larger than X(default - 10) Mb (in case if you have large demos, that could overflow dedicated RAM while being parsed)
[--v8-flags="--max-old-space-size=X"] - config javascript to use no more then X Mb ram (default - 4096) (unnecessary option, experimental, for low-end devices)

Output:
splits_gold.txt (best splits in txt format)
splits_map_times.txt (last parsed run folder times)
splits.lss (live-split compatible splits file with splits info from splits_map_times.txt and gold info from splits_gold.txt)
