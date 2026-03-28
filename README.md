# Portal Demo Splits Parser (Extension of NeKzor’s [sdp](https://github.com/NeKzor/sdp))

This project adds a .lss generation that builds on  
[NeKzor’s Source Demo Parser (sdp)](https://github.com/NeKzor/sdp).  
All core parsing logic inside the `sdp/` directory is © 2020-present NeKzor and contributors  
and is used here under the MIT license.

My additions are limited to:
- `parser.ts` – a wrapper that extracts gold splits and personal-best (PB) splits  
  from Portal/Source Engine demos and outputs LiveSplit-compatible `.lss` files.

---

## TL;DR

**Open PowerShell**  
   - Navigate to this repo’s root (where `parser.ts` is located).  
   - In the File Explorer address bar, type `PowerShell` and press Enter.  
     *(Alternatively: Win + R → `powershell` → `cd "path\to\repo"`)*

**Install Deno** (one-time):
   ```powershell
   irm https://deno.land/install.ps1 | iex
   ```

**Generate gold splits (full run history):**
   ```powershell
   deno run --allow-read --allow-write parser.ts "PATH\TO\fullgame" --gold
   ```
   > This can take 5–10 min depending on how many run folders you have.

**Generate PB splits (current PB folder):**
   ```powershell
   deno run --allow-read --allow-write parser.ts "PATH\TO\pb_folder"
   ```

After completion you will find `splits.lss` (LiveSplit-compatible) next to `parser.ts`.

---

## Notes
- For now, works only for a `/fullgame` category.
- In `.lss` Attempt IDs are ignored to keep saves small and speed up LiveSplit loading.
- Gold-extraction code is a mess — verify results before generating .lss file.

---

## Detailed Usage

### Extract Gold Splits
Scan the entire `fullgame` folder recursively to find best segments:
```powershell
deno run --allow-read --allow-write parser.ts "PATH\TO\fullgame" --gold
```
Add `--debug` to see progress logs.

Example:
```powershell
deno run --allow-read --allow-write parser.ts "D:\SteamLibrary\steamapps\common\Portal 2\portal2\demos\fullgame" --debug --gold
```

### Fetch PB Splits
Parse demos from your PB folder:
```powershell
deno run --allow-read --allow-write parser.ts "PATH\TO\pb_folder"
```
Example:
```powershell
deno run --allow-read --allow-write parser.ts "D:\SteamLibrary\steamapps\common\Portal 2\portal2\demos\fullgame\2025-09-21_19-59-37"
```

---

## Arguments
| Flag | Description |
|------|------------|
| `--gold` | Scan fullgame folder recursively to find best segments |
| `--debug` | Verbose logging |
| `--max-size X` | Skip demos larger than **X** MB (default 10) to avoid RAM overflow |
| `--v8-flags="--max-old-space-size=X"` | Limit Node/V8 heap to **X** MB (default 4096). Experimental. |

---

## Output Files
- `splits_gold.txt` – Best (gold) splits in text format  
- `splits_map_times.txt` – Times from the last parsed run folder  
- `splits.lss` – LiveSplit-compatible splits file combining gold and PB data

---

## Credits & License
- **Source demo parser** [NeKzor/sdp](https://github.com/NeKzor/sdp)  
  © 2020-present NeKzor and contributors. Licensed under [MIT](sdp/LICENSE)
