
import { join } from "https://deno.land/std@0.203.0/path/mod.ts";

// --- Import SDP parser ---
let sdpModule: any;
try {
  sdpModule = await import("./sdp/mod.js");
} catch (e) {
  console.error("Failed to import ./sdp/mod.js. Make sure sdp/mod.js exists and is valid ESM.");
  throw e;
}
const SourceDemoParserExport = sdpModule.SourceDemoParser ?? sdpModule.default ?? sdpModule;
if (!SourceDemoParserExport) {
  console.error("Could not find SourceDemoParser export in ./sdp/mod.js");
  Deno.exit(1);
}

// Instantiate parser and enable message decoding if possible
let parser: any;
try {
  if (typeof SourceDemoParserExport === "function") {
    try { parser = new (SourceDemoParserExport as any)(); } catch { parser = (SourceDemoParserExport as any)(); }
  } else if (SourceDemoParserExport && typeof SourceDemoParserExport.default === "function") {
    try { parser = new (SourceDemoParserExport.default as any)(); } catch { parser = (SourceDemoParserExport.default as any)(); }
  } else {
    parser = SourceDemoParserExport;
  }

  if (parser && typeof parser.setOptions === "function") {
    try { parser.setOptions({ messages: true, userCmds: true, netMessages: true }); }
    catch { try { parser.setOptions({ messages: true, userCmds: true }); } catch { /* ignore */ } }
  }
} catch (err) {
  console.error("Failed to instantiate SourceDemoParser:", err);
  throw err;
}

// --- CLI args parsing ---
const rawArgs = Deno.args;
const flags = new Set(rawArgs.filter(a => a.startsWith("-")));
const posArgs = rawArgs.filter(a => !a.startsWith("-"));
if (posArgs.length < 1) {
  console.error("Usage: deno run --allow-read --allow-write parser.ts <demos_dir> [out_basename] [--debug] [--gold] [--max-size 10]");
  Deno.exit(1);
}
const demosDir = posArgs[0];
const outBase = posArgs[1] ?? "splits";
const debug = flags.has("--debug");
const goldMode = flags.has("--gold");

// max-size option (skip large demos)
let maxSizeMB = 10;
const maxSizeIndex = rawArgs.indexOf("--max-size");
if (maxSizeIndex !== -1 && maxSizeIndex + 1 < rawArgs.length) {
  const m = parseInt(rawArgs[maxSizeIndex + 1], 10);
  if (!isNaN(m) && m > 0) maxSizeMB = m;
}
const maxSizeBytes = maxSizeMB * 1024 * 1024;

// outputs
const lssOutFile = `${outBase}.lss`;
const mapTimesOutFile = `${outBase}_map_times.txt`;

// map_list
const MAP_LIST = [
  "sp_a1_intro1", "sp_a1_intro2", "sp_a1_intro3", "sp_a1_intro4", "sp_a1_intro5", "sp_a1_intro6", "sp_a1_intro7",
  "sp_a1_wakeup", "sp_a2_intro", "sp_a2_laser_intro", "sp_a2_laser_stairs", "sp_a2_dual_lasers", "sp_a2_laser_over_goo",
  "sp_a2_catapult_intro", "sp_a2_trust_fling", "sp_a2_pit_flings", "sp_a2_fizzler_intro", "sp_a2_sphere_peek",
  "sp_a2_ricochet", "sp_a2_bridge_intro", "sp_a2_bridge_the_gap", "sp_a2_turret_intro", "sp_a2_laser_relays",
  "sp_a2_turret_blocker", "sp_a2_laser_vs_turret", "sp_a2_pull_the_rug", "sp_a2_column_blocker", "sp_a2_laser_chaining",
  "sp_a2_triple_laser", "sp_a2_bts1", "sp_a2_bts2", "sp_a2_bts3", "sp_a2_bts4", "sp_a2_bts5", "sp_a2_bts6", "sp_a2_core",
  "sp_a3_00", "sp_a3_01", "sp_a3_03", "sp_a3_jump_intro", "sp_a3_bomb_flings", "sp_a3_crazy_box", "sp_a3_transition01",
  "sp_a3_speed_ramp", "sp_a3_speed_flings", "sp_a3_portal_intro", "sp_a3_end", "sp_a4_intro", "sp_a4_tb_intro",
  "sp_a4_tb_trust_drop", "sp_a4_tb_wall_button", "sp_a4_tb_polarity", "sp_a4_tb_catch", "sp_a4_stop_the_box",
  "sp_a4_laser_catapult", "sp_a4_laser_platform", "sp_a4_speed_tb_catch", "sp_a4_jump_polarity", "sp_a4_finale1",
  "sp_a4_finale2", "sp_a4_finale3", "sp_a4_finale4"
];

// split-list
const SEGMENT_NAMES = [
  "-Container Ride", "-Portal Carousel", "-Portal Gun", "-Smooth Jazz", "-Cube Momentum", "-Future Starter", "-Secret Panel",
  "-Wakeup", "{Chapter 1} Incinerator", "-Laser Intro", "-Laser Stairs", "-Dual Lasers", "-Laser Over Goo",
  "-Catapult Intro", "-Trust Fling", "-Pit Flings", "{Chapter 2} Fizzler Intro", "-Ceiling Catapult", "-Ricochet",
  "-Bridge Intro", "-Bridge the Gap", "-Turret Intro", "-Laser Relays", "-Turret Blocker", "-Laser vs. Turret",
  "{Chapter 3} Pull the Rug", "-Column Blocker", "-Laser Chaining", "-Triple Laser", "-Jailbreak", "{Chapter 4} Escape",
  "-Turret Factory", "-Turret Sabotage", "-Neurotoxin Sabotage", "-Tube Ride", "{Chapter 5} Core", "-Long Fall",
  "-Underground", "-Cave Johnson", "-Repulsion Intro", "-Bomb Flings", "-Crazy Box", "{Chapter 6} PotatOS",
  "-Prop Intro", "-Prop Flings", "-Conversion Intro", "{Chapter 7} Three Gels", "-Test", "-Funnel Intro", "-Ceiling Button",
  "-Wall Button", "-Polarity", "-Funnel Catch", "-Stop the Box", "-Laser Catapult", "-Laser Platform", "-Prop Catch",
  "{Chapter 8} Repulsion Polarity", "-Finale 1", "-Finale 2", "-Finale 3", "{Chapter 9} Finale 4"
];

// Container Ride offset and Gold-split filter treshold (such a crutch honestly) 
const PARSER_OFFSET_SEC = 5 * 60 + 10 + 0.550; // 310.55 seconds
const MIN_GOLD_TIME = 17; // seconds minimum for raw per-map time

// Handling cutscene splits (parser output for these is usually incorrect)
const FORCE_ALWAYS_FINISHED = new Set<string>(["sp_a2_bts6", "sp_a3_00"]);

// --- Helper functions ---
// safe numeric conversion (some interfaces cuz im not good at coding)
function safeNum(v: any): number { return (typeof v === "number" && Number.isFinite(v)) ? v : 0; }
function naturalKey(name: string) {
  const noExt = name.replace(/\.dem$/i, "");
  const m = noExt.match(/^(.*)_(\d+)$/);
  if (m) return { base: m[1], idx: parseInt(m[2], 10) };
  return { base: noExt, idx: 0 };
}

// collect demo files from folder, sorted to parse in correct order (nekz.me web parser does not do that correctly)
async function collectDemos(dir: string) {
  const arr: { path: string; name: string }[] = [];
  try {
    for await (const e of Deno.readDir(dir)) {
      if (!e.isFile) continue;
      if (!e.name.startsWith("fullgame_")) continue;
      arr.push({ path: join(dir, e.name), name: e.name });
    }
  } catch (err) {
    console.error("Failed reading directory:", err.message ?? err);
    Deno.exit(2);
  }
  arr.sort((a, b) => {
    const A = naturalKey(a.name), B = naturalKey(b.name);
    if (A.base === B.base) return A.idx - B.idx;
    return A.base < B.base ? -1 : 1;
  });
  return arr;
}

// get interval per tick (another crutch but im happy with it)
function getIptSafely(demo: any) {
  try {
    if (typeof demo.getIntervalPerTick === "function") {
      const ipt = demo.getIntervalPerTick();
      if (typeof ipt === "number" && ipt > 0 && Number.isFinite(ipt)) return ipt;
    }
  } catch (_e) {}
  return 0.016;
}

//(oh boy another crutch)
function ticksToSeconds(ticks: number): number {
  if (!Number.isFinite(ticks) || ticks <= 0) return 0;
  const q = Math.floor(ticks / 6);
  const r = ticks % 6;
  const remMap = [0.0, 0.016, 0.033, 0.050, 0.067, 0.083];
  const sec = q * 0.1 + remMap[r];
  return Number(sec.toFixed(3));
}

// (more crutches, god bless crutches (im still snapping ticks cuz why not lmao))
function formatClockWithSnap(secIn: number): string {
  const totalMs = Math.round(secIn * 1000);
  const totalSec = Math.floor(totalMs / 1000);
  const ms = totalMs % 1000;
  const tenths = Math.floor(ms / 100);
  const hundredthsThousandths = ms % 100;
  const patterns = [17, 33, 50, 67, 83, 0];
  let closestPattern = patterns[0];
  let minDiff = Math.abs(hundredthsThousandths - closestPattern);
  for (const pattern of patterns) {
    const diff = Math.abs(hundredthsThousandths - pattern);
    if (diff < minDiff) { minDiff = diff; closestPattern = pattern; }
  }
  let newMs = tenths * 100 + closestPattern;
  let newTotalSec = totalSec;
  if (newMs >= 1000) { newMs = 0; newTotalSec += 1; }
  const seconds = newTotalSec % 60;
  const minutes = Math.floor(newTotalSec / 60) % 60;
  const hours = Math.floor(newTotalSec / 3600);
  const msStr = newMs.toString().padStart(3, '0');
  const secStr = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const minStr = minutes.toString().padStart(2, '0');
    return `${hours}:${minStr}:${secStr}.${msStr}`;
  }
  return `${minutes}:${secStr}.${msStr}`;
}

// Parse formatted times "M:SS.mmm" or "H:MM:SS.mmm" -> ms
function parseFormattedTimeToMs(s: string): number {
  if (!s || typeof s !== "string") return NaN;
  const parts = s.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const secParts = parts[1].split(".");
    const seconds = parseInt(secParts[0], 10) || 0;
    const ms = parseInt((secParts[1] ?? "0").padEnd(3, "0").slice(0,3), 10) || 0;
    return minutes * 60000 + seconds * 1000 + ms;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const secParts = parts[2].split(".");
    const seconds = parseInt(secParts[0], 10) || 0;
    const ms = parseInt((secParts[1] ?? "0").padEnd(3, "0").slice(0,3), 10) || 0;
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + ms;
  }
  return NaN;
}

function parseClockStringToSeconds(s: string): number {
  const ms = parseFormattedTimeToMs(s);
  if (!Number.isFinite(ms) || isNaN(ms)) return NaN;
  return ms / 1000;
}

// parse snapped string back to ms (omfg i love crutching my code)
function parseSnappedClockToMs(clocked: string): number {
  if (!clocked || typeof clocked !== "string") return 0;
  const parts = clocked.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const secMs = parts[1].split(".");
    const seconds = parseInt(secMs[0], 10) || 0;
    const ms = parseInt((secMs[1] ?? "0").padEnd(3, "0").slice(0,3), 10) || 0;
    return minutes * 60000 + seconds * 1000 + ms;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const secMs = parts[2].split(".");
    const seconds = parseInt(secMs[0], 10) || 0;
    const ms = parseInt((secMs[1] ?? "0").padEnd(3, "0").slice(0,3), 10) || 0;
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + ms;
  }
  return 0;
}

// ms -> LiveSplit time string H:MM:SS.fffffff
function msToLssTime(totalMs: number): string {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return "";
  const totalSeconds = Math.floor(totalMs / 1000);
  const fracMs = totalMs % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const frac7 = (fracMs * 10000).toString().padStart(7, "0");
  const hoursStr = hours.toString();
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");
  return `${hoursStr}:${minutesStr}:${secondsStr}.${frac7}`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Detects if a demo contains the escape command "gameui_allowescapetoshow"
function detectEscapeCommand(demo: any): { found: boolean; where?: string; tick?: number; text?: string } {
  if (!demo) return { found: false }; // Early return if demo is null/undefined
  const needle = "gameui_allowescapetoshow";

  // Helper function: checks if a single message object contains the msg
  function checkMsgShallow(m: any): { found: boolean; text?: string; tick?: number } {
    if (!m || typeof m !== "object") return { found: false };
    const fields = ["command", "cmd", "text", "data", "payload", "name", "message"];
    for (const f of fields) {
      if (f in m && typeof m[f] === "string" && m[f].includes(needle)) {
        const tick = (m as any).tick ?? (m as any).time ?? undefined;
        return { found: true, text: m[f], tick };
      }
    }
    if (typeof (m as any).raw === "string" && (m as any).raw.includes(needle)) {
      return { found: true, text: (m as any).raw, tick: (m as any).tick ?? undefined };
    }
    return { found: false };
  }

  try {
    // If the demo supports `findMessages` and sdpModule is available
    if (typeof demo.findMessages === "function" && sdpModule && sdpModule.DemoMessages) {
      const dm = sdpModule.DemoMessages;
      const candidates = Object.keys(dm).filter(k => /console|cmd|command|user|message|saytext/i.test(k));
      for (const key of candidates) {
        try {
          const enumVal = (dm as any)[key];
          const msgs = demo.findMessages(enumVal);
          if (Array.isArray(msgs) && msgs.length > 0) {
            const sliceFrom = Math.max(0, msgs.length - 50);
            for (let i = sliceFrom; i < msgs.length; i++) {
              const m = msgs[i];
              const res = checkMsgShallow(m);
              if (res.found) return { found: true, where: `findMessages(${key})`, tick: res.tick, text: res.text };
            }
          }
        } catch (_e) {}
      }
    }
  } catch (_) {}

  try {
    // this is some desparate vibe-coding right here
    const topCandidates = ["consoleCommands", "userCommands", "userMessages", "netMessages", "networkMessages", "stringTables", "console", "commands"];
    for (const prop of topCandidates) {
      if (prop in demo) {
        const val = (demo as any)[prop];
        if (Array.isArray(val) && val.length > 0) {
          const sliceFrom = Math.max(0, val.length - 200);
          for (let i = sliceFrom; i < val.length; i++) {
            const item = val[i];
            const res = checkMsgShallow(item);
            if (res.found) return { found: true, where: prop, tick: res.tick, text: res.text };
          }
        } else if (typeof val === "string" && val.includes(needle)) {
          return { found: true, where: prop, text: val };
        }
      }
    }
  } catch (_) {}

  try {
    if (Array.isArray(demo.messages) && demo.messages.length > 0) {
      const sliceFrom = Math.max(0, demo.messages.length - 200);
      for (let i = sliceFrom; i < demo.messages.length; i++) {
        const m = demo.messages[i];
        const res = checkMsgShallow(m);
        if (res.found) return { found: true, where: "demo.messages", tick: res.tick, text: res.text };
      }
    }
  } catch (_) {}

  return { found: false };
}

function detectFinalMapEnd(demo: any): { found: boolean; where?: string; tick?: number; text?: string } {
  if (!demo) return { found: false };
  const needles = [
    "map_wants_save_disable",
    "ent_fire prop_portal fizzle",
    "hud_subtitles"
  ];
  // even more desparation
  function checkMsgForNeedles(m: any): { found: boolean; text?: string; tick?: number } {
    if (!m || typeof m !== "object") return { found: false };
    const fields = ["command", "cmd", "text", "data", "payload", "name", "message", "raw"];
    for (const f of fields) {
      if (f in m && typeof m[f] === "string") {
        const text = m[f] as string;
        for (const needle of needles) {
          if (text.includes(needle)) {
            const tick = (m as any).tick ?? (m as any).time ?? undefined;
            return { found: true, text, tick };
          }
        }
      }
    }
    return { found: false };
  }

  try {
    if (typeof demo.findMessages === "function" && sdpModule && sdpModule.DemoMessages) {
      const dm = sdpModule.DemoMessages;
      const candidates = Object.keys(dm).filter(k => /console|cmd|command|user|message|saytext/i.test(k));
      for (const key of candidates) {
        try {
          const enumVal = (dm as any)[key];
          const msgs = demo.findMessages(enumVal);
          if (Array.isArray(msgs) && msgs.length > 0) {
            const sliceFrom = Math.max(0, msgs.length - 50); // Only check last 50 messages
            for (let i = sliceFrom; i < msgs.length; i++) {
              const m = msgs[i];
              const res = checkMsgForNeedles(m);
              if (res.found) return { found: true, where: `findMessages(${key})`, tick: res.tick, text: res.text };
            }
          }
        } catch (_e) {}
      }
    }
  } catch (_) {}

  try {
    // tunnel of despair
    // Check top-level properties of the demo object for arrays or strings
    const topCandidates = ["consoleCommands", "userCommands", "userMessages", "netMessages", "networkMessages", "stringTables", "console", "commands", "messages"];
    for (const prop of topCandidates) {
      if (prop in demo) {
        const val = (demo as any)[prop];
        if (Array.isArray(val) && val.length > 0) {
          const sliceFrom = Math.max(0, val.length - 200);
          for (let i = sliceFrom; i < val.length; i++) {
            const item = val[i];
            const res = checkMsgForNeedles(item);
            if (res.found) return { found: true, where: prop, tick: res.tick, text: res.text };
          }
        } else if (typeof val === "string") {
          for (const needle of needles) {
            if (val.includes(needle)) return { found: true, where: prop, text: val };
          }
        }
      }
    }
  } catch (_) {}

  return { found: false };
}
//^^^ this took my sanity (and like 8 hrs)
// Welp, nobody in p2sr-dev answered


// --- Process a single run folder, group demos by map ---
// (keeps logic from first snippet)
async function processRunFolder(runFolder: string, runName: string) {
  const files = await collectDemos(runFolder);
  if (files.length === 0) {
    if (debug) console.log(`No demos found in: ${runFolder}`);
    return null;
  }

  type DemoEntry = { file: string; map: string; ticks: number; playbackTime: number; skipped: boolean; hasEscape: boolean };

  const entries: DemoEntry[] = [];

  for (const f of files) {
    // file size guard
    try {
      const stat = await Deno.stat(f.path);
      if (stat.size > maxSizeBytes) {
        if (debug) console.log(`Skipping oversized demo: ${f.name} (${(stat.size/1024/1024).toFixed(2)}MB > ${maxSizeMB}MB)`);
        entries.push({ file: f.name, map: "unknown", ticks: 0, playbackTime: 0, skipped: true, hasEscape: false });
        continue;
      }
    } catch (err) {
      console.error("Cannot stat file:", f.path, err);
      entries.push({ file: f.name, map: "unknown", ticks: 0, playbackTime: 0, skipped: true, hasEscape: false });
      continue;
    }

    let buf: Uint8Array;
    try {
      buf = await Deno.readFile(f.path);
    } catch (err) {
      console.error("Cannot read file:", f.path, err);
      entries.push({ file: f.name, map: "unknown", ticks: 0, playbackTime: 0, skipped: true, hasEscape: false });
      continue;
    }

    let demo: any;
    try {
      demo = parser.parse(buf);
      demo.fileInfo = { name: f.name };
    } catch (err) {
      if (debug) console.warn("SDP parse failed for", f.name, err);
      entries.push({ file: f.name, map: "unknown", ticks: 0, playbackTime: 0, skipped: true, hasEscape: false });
      continue;
    }

    try {
      const dg = (typeof demo.detectGame === "function") ? demo.detectGame() : null;
      if (dg && typeof dg.adjustTicks === "function") { try { dg.adjustTicks(); } catch (_) {} }
    } catch (_) {}

    try { if (typeof demo.adjustRange === "function") demo.adjustRange(); } catch (_) {}

    if (!("playbackTicks" in demo) || demo.playbackTicks === 0) {
      try {
        const ipt = getIptSafely(demo);
        demo.playbackTicks = 1;
        demo.playbackTime = ipt;
      } catch (_) {
        demo.playbackTicks = demo.playbackTicks ?? 0;
        demo.playbackTime = demo.playbackTime ?? 0;
      }
    }

    let mapName = demo.mapName ?? demo.map ?? "unknown";
    if (!mapName || typeof mapName !== "string" || mapName.length === 0) {
      const headerText = new TextDecoder("latin1").decode(buf.slice(0, 8192));
      const mm = headerText.match(/(sp_[a-z0-9_]+)/i);
      mapName = mm ? mm[1] : "unknown";
    }

    // Skip demo files that are forced maps (we will inject forced times later)
    if (FORCE_ALWAYS_FINISHED.has(mapName)) {
      if (debug) console.log(`[debug] skipping demo ${f.name} for forced map ${mapName}`);
      continue;
    }

    let ticks = Math.round(safeNum(demo.playbackTicks ?? demo.ticks ?? demo.ticks_length ?? 0));
    let pTime = safeNum(demo.playbackTime ?? demo.playback_time ?? 0);

    if ((ticks === 0 || !ticks) && pTime > 0) {
      const ipt = getIptSafely(demo);
      const t60 = Math.round(pTime / (1 / 60));
      ticks = Math.abs(t60 * (1 / 60) - pTime) < 0.001 ? t60 : Math.round(pTime / ipt);
    }

    ticks = Number.isFinite(ticks) && ticks >= 0 ? Math.round(ticks) : 0;
    pTime = Number.isFinite(pTime) && pTime >= 0 ? pTime : 0;

    const escapeRes = detectEscapeCommand(demo);
    let finalRes = { found: false } as { found: boolean; where?: string; tick?: number; text?: string };
    if (mapName === "sp_a4_finale4") finalRes = detectFinalMapEnd(demo);
    const hasEscape = Boolean(escapeRes.found || finalRes.found);

    if (debug) {
      const parts: string[] = [];
      if (escapeRes.found) parts.push(`escape(${escapeRes.where}${escapeRes.tick ? ` @tick ${escapeRes.tick}` : ""})`);
      if (finalRes.found) parts.push(`final_end(${finalRes.where}${finalRes.tick ? ` @tick ${finalRes.tick}` : ""})`);
      const escLog = parts.length > 0 ? parts.join(" | ") : "N";
      console.log(`[debug] parsed ${f.name} -> map=${mapName}, ticks=${ticks}, playbackTime=${pTime}, escape=${escLog}`);
    }

    entries.push({ file: f.name, map: mapName, ticks, playbackTime: pTime, skipped: false, hasEscape });
  }

  // Group consecutive demos by map and sum ticks
  const groupsRaw: { map: string; ticks: number; files: string[]; hasEscape: boolean; valid: boolean }[] = [];
  let curMap: string | null = null;
  let curTicks = 0;
  let curFiles: string[] = [];
  let curHasEscape = false;
  let curValid = true;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.skipped) {
      if (curMap !== null) {
        groupsRaw.push({ map: curMap, ticks: curTicks, files: [...curFiles], hasEscape: curHasEscape, valid: false });
      }
      curMap = null; curTicks = 0; curFiles = []; curHasEscape = false; curValid = true;
      continue;
    }

    if (curMap === null) {
      curMap = e.map; curTicks = e.ticks; curFiles = [e.file]; curHasEscape = e.hasEscape; curValid = true;
    } else if (e.map === curMap) {
      curTicks += e.ticks; curFiles.push(e.file); if (e.hasEscape) curHasEscape = true;
    } else {
      groupsRaw.push({ map: curMap, ticks: curTicks, files: [...curFiles], hasEscape: curHasEscape, valid: curValid });
      curMap = e.map; curTicks = e.ticks; curFiles = [e.file]; curHasEscape = e.hasEscape; curValid = true;
    }
  }
  if (curMap !== null) groupsRaw.push({ map: curMap, ticks: curTicks, files: [...curFiles], hasEscape: curHasEscape, valid: curValid });

  // Build groupsMap and inject forced maps
  const groupsMap = new Map<string, { map: string; ticks: number; files: string[]; hasEscape: boolean; valid: boolean; finishedCandidate?: boolean; finished?: boolean }>();
  for (const g of groupsRaw) groupsMap.set(g.map, { ...g, finishedCandidate: false, finished: false });

  // Inject forced always-finished maps
  for (const forcedMap of FORCE_ALWAYS_FINISHED) {
    const forcedSec = (forcedTimes as any)[forcedMap];
    if (!forcedSec) {
      if (debug) console.log(`[debug] WARNING: forced map ${forcedMap} has no forced time configured`);
      continue;
    }
    const forcedTicks = findBestTicksForSeconds(forcedSec);
    groupsMap.set(forcedMap, {
      map: forcedMap,
      ticks: forcedTicks,
      files: [],
      hasEscape: true,
      valid: true,
      finishedCandidate: true,
      finished: true
    });
    if (debug) console.log(`[debug] injected forced map ${forcedMap}: ${forcedSec}s -> ${forcedTicks} ticks`);
  }

  // Compute finishedCandidate for each group (raw per-map time must be >= MIN_GOLD_TIME and have exit)
  for (const [mapId, ent] of groupsMap.entries()) {
    if (FORCE_ALWAYS_FINISHED.has(mapId)) { ent.finishedCandidate = true; ent.finished = true; groupsMap.set(mapId, ent); continue; }
    const sec = ticksToSeconds(ent.ticks);
    ent.finishedCandidate = Boolean(ent.hasEscape && sec >= MIN_GOLD_TIME);
    groupsMap.set(mapId, ent);
    if (debug) console.log(`[debug] group ${mapId}: ticks=${ent.ticks}, sec=${sec}, hasEscape=${ent.hasEscape}, candidate=${ent.finishedCandidate}`);
  }

  // Walk MAP_LIST and mark finished only if all previous maps were finished (forced maps are unconditional)
  let allPrevFinished = true;
  for (const mapId of MAP_LIST) {
    const ent = groupsMap.get(mapId);
    if (!ent) { allPrevFinished = false; continue; }
    if (FORCE_ALWAYS_FINISHED.has(mapId)) ent.finished = true;
    else ent.finished = Boolean(ent.finishedCandidate && ent.valid && allPrevFinished);
    groupsMap.set(mapId, ent);
    if (debug) console.log(`[debug] finalize ${mapId}: finished=${ent.finished} (candidate=${ent.finishedCandidate}, valid=${ent.valid}, allPrevFinished=${allPrevFinished})`);
    allPrevFinished = allPrevFinished && ent.finished;
  }

  // Build finalGroups preserving order, and ensure forced maps are present at end if missing
  const finalGroups: { map: string; ticks: number; files: string[]; finished: boolean; valid: boolean; hasEscape?: boolean }[] = [];
  for (const g of groupsRaw) {
    const ent = groupsMap.get(g.map);
    finalGroups.push({
      map: g.map,
      ticks: ent ? ent.ticks : g.ticks,
      files: ent ? ent.files : g.files,
      finished: ent ? ent.finished ?? false : false,
      valid: ent ? ent.valid : g.valid,
      hasEscape: ent ? ent.hasEscape : g.hasEscape
    });
  }
  for (const forcedMap of FORCE_ALWAYS_FINISHED) {
    if (!finalGroups.some(x => x.map === forcedMap)) {
      const ent = groupsMap.get(forcedMap)!;
      finalGroups.push({ map: forcedMap, ticks: ent.ticks, files: ent.files ?? [], finished: ent.finished ?? true, valid: ent.valid ?? true, hasEscape: ent.hasEscape });
    }
  }

  return { runName, groups: finalGroups, entries };
}

// --- Forced times ---
const forcedTimes: Record<string, number> = {
  "sp_a2_bts6": 51.867,
  "sp_a3_00": 77.767
};

function findBestTicksForSeconds(targetSec: number, hintTicks = 0): number {
  if (!Number.isFinite(targetSec) || targetSec <= 0) return 0;
  const approx = Math.max(1, Math.ceil(targetSec / 0.016));
  const start = Math.max(1, Math.floor(approx - 200));
  const end = approx + 200;
  let bestTicks = start;
  let bestDiff = Infinity;
  for (let t = start; t <= end; t++) {
    const s = ticksToSeconds(t);
    const diff = Math.abs(s - targetSec);
    if (diff < bestDiff) { bestDiff = diff; bestTicks = t; if (diff === 0) break; }
  }
  if (bestDiff > 0.2) {
    for (let t = end + 1; t <= Math.max(end + 10000, approx * 2); t++) {
      const s = ticksToSeconds(t); const diff = Math.abs(s - targetSec);
      if (diff < bestDiff) { bestDiff = diff; bestTicks = t; if (diff === 0) break; }
    }
  }
  return Math.max(1, Math.round(bestTicks));
}

function applyForcedTimes(groups: { map: string; ticks: number; files: string[]; finished?: boolean; valid?: boolean; hasEscape?: boolean }[]) {
  for (const g of groups) {
    if (Object.prototype.hasOwnProperty.call(forcedTimes, g.map)) {
      const forcedSec = (forcedTimes as any)[g.map];
      const bestTicks = findBestTicksForSeconds(forcedSec, g.ticks);
      if (debug) console.log(`[debug] forcing ${g.map}: forcedSec=${forcedSec}, oldTicks=${g.ticks}, newTicks=${bestTicks}`);
      g.ticks = bestTicks;
      if (FORCE_ALWAYS_FINISHED.has(g.map)) { g.finished = true; g.valid = true; g.hasEscape = true; }
    }
  }
}

// --- Gold search (same algorithm as before) ---
function isValidGoldTimeRaw(mapName: string, ticks: number): boolean {
  const seconds = ticksToSeconds(ticks);
  if (debug) console.log(`[debug] isValidGoldTimeRaw ${mapName}: raw_sec=${seconds.toFixed(3)}, min=${MIN_GOLD_TIME}`);
  return seconds >= MIN_GOLD_TIME;
}

async function processAllRunsForGold(demosDir: string) {
  const goldSplits = new Map<string, { ticks: number; runName: string }>();
  const subdirs: string[] = [];
  for await (const entry of Deno.readDir(demosDir)) {
    if (entry.isDirectory) subdirs.push(join(demosDir, entry.name));
  }
  if (subdirs.length === 0) subdirs.push(demosDir);

  for (const subdir of subdirs) {
    const runName = subdir.split(/[\\/]/).pop() || subdir;
    if (debug) console.log(`\n--- Processing run for gold: ${runName} ---`);
    const result = await processRunFolder(subdir, runName);
    if (!result) continue;
    applyForcedTimes(result.groups);

    // build quick map
    const runGroupMap = new Map(result.groups.map(g => [g.map, g] as const));

    // ensure forced maps
    for (const forcedMap of FORCE_ALWAYS_FINISHED) {
      if (!runGroupMap.has(forcedMap)) {
        const forcedSec = (forcedTimes as any)[forcedMap] ?? 0;
        runGroupMap.set(forcedMap, { map: forcedMap, ticks: findBestTicksForSeconds(forcedSec), files: [], finished: true, valid: true, hasEscape: true } as any);
      } else {
        const g = runGroupMap.get(forcedMap)!;
        const forcedSec = (forcedTimes as any)[forcedMap] ?? 0;
        g.ticks = findBestTicksForSeconds(forcedSec);
        g.finished = true; g.valid = true; g.hasEscape = true;
        runGroupMap.set(forcedMap, g);
      }
    }

    // collect golds
    for (const [mapId, g] of runGroupMap.entries()) {
      if (FORCE_ALWAYS_FINISHED.has(mapId)) {
        const forcedSec = (forcedTimes as any)[mapId] ?? 0;
        const forcedTicks = findBestTicksForSeconds(forcedSec);
        const currentBest = goldSplits.get(mapId);
        if (!currentBest || forcedTicks < currentBest.ticks) {
          goldSplits.set(mapId, { ticks: forcedTicks, runName: "FORCED" });
          if (debug) console.log(`[gold] forced gold for ${mapId}: ${forcedTicks} ticks (${forcedSec}s)`);
        }
        continue;
      }

      if (!g.valid) { if (debug) console.log(`Skipping ${mapId} in ${runName} because group invalid`); continue; }
      if (!g.finished) { if (debug) console.log(`Skipping ${mapId} in ${runName} because not finished (per rules)`); continue; }
      if (!isValidGoldTimeRaw(mapId, g.ticks)) { if (debug) console.log(`Skipping ${mapId} in ${runName} due to raw time below threshold`); continue; }

      const currentBest = goldSplits.get(mapId);
      if (!currentBest || g.ticks < currentBest.ticks) {
        goldSplits.set(mapId, { ticks: g.ticks, runName });
        if (debug) console.log(`New gold candidate for ${mapId}: ${g.ticks} ticks from ${runName}`);
      }
    }
  }

  // ensure forced maps in golds
  for (const forcedMap of FORCE_ALWAYS_FINISHED) {
    const forcedSec = (forcedTimes as any)[forcedMap] ?? 0;
    const forcedTicks = findBestTicksForSeconds(forcedSec);
    if (!goldSplits.has(forcedMap)) {
      goldSplits.set(forcedMap, { ticks: forcedTicks, runName: "FORCED" });
      if (debug) console.log(`[gold] ensured forced gold for ${forcedMap}: ${forcedTicks} ticks (${forcedSec}s)`);
    }
  }

  return goldSplits;
}

// --- Parse external golds file (cumulative times expected) ---
function splitColumns(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map(x => x.trim());
  return line.trim().split(/\s{2,}/).map(x => x.trim());
}

function parseGoldsText(txt: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = txt.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^Map\b/i.test(line) || /^#/.test(line)) continue;
    const cols = splitColumns(line);
    if (cols.length < 1) continue;
    const mapName = cols[0];
    if (!/^sp_/.test(mapName)) continue;
    // try formatted time (col 5) first
    let seconds = NaN;
    if (cols.length >= 5 && cols[4] && /[:.]/.test(cols[4])) {
      seconds = parseClockStringToSeconds(cols[4]);
      if (Number.isFinite(seconds)) { map.set(mapName, seconds); if (debug) console.log(`[debug] golds parsed ${mapName} from formatted col -> ${seconds.toFixed(3)}s`); continue; }
    }
    // try numeric seconds (col 3)
    if (cols.length >= 3 && cols[2]) {
      const num = Number(cols[2]);
      if (Number.isFinite(num)) { map.set(mapName, num); if (debug) console.log(`[debug] golds parsed ${mapName} from numeric col -> ${num.toFixed(3)}s`); continue; }
    }
    // fallback regex for time-like token
    const m = line.match(/(\d{1,2}:\d{2}\.\d{1,7})/);
    if (m) {
      const sec = parseClockStringToSeconds(m[1]);
      if (Number.isFinite(sec)) { map.set(mapName, sec); if (debug) console.log(`[debug] golds parsed ${mapName} from regex -> ${sec.toFixed(3)}s`); continue; }
    }
    if (debug) console.log(`[debug] golds: could not parse time for ${mapName} in line: ${line}`);
  }
  return map;
}

function parseGoldsFileCandidates(base: string): Map<string, number> | null {
  const candidates = ["splits_gold.txt", `${base}_splits_gold.txt`];
  for (const name of candidates) {
    try {
      const txt = Deno.readTextFileSync(name);
      if (txt && txt.length > 0) {
        if (debug) console.log(`[debug] using golds source: ${name}`);
        return parseGoldsText(txt);
      }
    } catch (_e) { /* try next */ }
  }
  if (debug) console.log(`[debug] no golds file found among candidates: ${candidates.join(", ")}`);
  return null;
}

// create splits.lss based on the Bets' livesplit layout
function buildLssXmlFromGroups(groups: { map: string; ticks: number; files: string[]; finished: boolean }[], goldsMap?: Map<string, number>) {
  // Keep header Offset exactly as in your previous sample (unchanged)
  const headerOffsetStr = "00:05:16.3300000";

  const head = `<?xml version="1.0" encoding="UTF-8"?>
<Run version="1.7.0">
  <GameIcon />
  <GameName>Portal 2</GameName>
  <CategoryName>Single Player</CategoryName>
  <LayoutPath>
  </LayoutPath>
  <Metadata>
    <Run id="" />
    <Platform usesEmulator="False">PC</Platform>
    <Region>
    </Region>
    <Variables>
      <Variable name="Quicksaves">Yes</Variable>
      <Variable name="Singleplayer Category">No SLA</Variable>
    </Variables>
  </Metadata>
  <Offset>${escapeXml(headerOffsetStr)}</Offset>
  <AttemptCount>1</AttemptCount>
  <AttemptHistory />
  <Segments>`;

  const tail = `
  </Segments>
  <AutoSplitterSettings />
</Run>`;

  const groupMap = new Map(groups.map(g => [g.map, g] as const));

  let body = "";
  // Start cumulative with PARSER_OFFSET_SEC so right-most column includes parser offset.
  let cumulativeSec = PARSER_OFFSET_SEC;

  for (let i = 0; i < MAP_LIST.length; i++) {
    const mapId = MAP_LIST[i];
    const segName = SEGMENT_NAMES[i] ?? mapId;
    const escapedName = escapeXml(segName);

    let segSeconds = 0;
    let haveSeg = false;
    const g = groupMap.get(mapId);
    if (g && g.ticks > 0) {
      segSeconds = ticksToSeconds(g.ticks);
      haveSeg = true;
    }

    let splitTimeXml = `<SplitTime name="Personal Best" />`;
    let segHistoryXml = `<SegmentHistory />`;
    let bestSegmentTimeXml = `<BestSegmentTime />`;

    if (haveSeg) {
      cumulativeSec += segSeconds;

      // Snap the cumulative to the right-most column pattern
      const snapped = formatClockWithSnap(cumulativeSec);
      const totalMs = parseSnappedClockToMs(snapped);
      const lssTime = msToLssTime(totalMs);

      splitTimeXml = `<SplitTime name="Personal Best">
          <RealTime>${escapeXml(lssTime)}</RealTime>
          <GameTime>${escapeXml(lssTime)}</GameTime>
        </SplitTime>`;

      segHistoryXml = `<SegmentHistory>
        <Time id="1">
          <RealTime>${escapeXml(lssTime)}</RealTime>
          <GameTime>${escapeXml(lssTime)}</GameTime>
        </Time>
      </SegmentHistory>`;
    }

    // Use gold split for BestSegmentTime if available
    if (goldsMap && goldsMap.has(mapId)) {
      const goldSeconds = goldsMap.get(mapId)!;
      const goldSnapped = formatClockWithSnap(goldSeconds);
      const goldTotalMs = parseSnappedClockToMs(goldSnapped);
      const goldLssTime = msToLssTime(goldTotalMs);
      
      bestSegmentTimeXml = `<BestSegmentTime>
          <RealTime>${escapeXml(goldLssTime)}</RealTime>
          <GameTime>${escapeXml(goldLssTime)}</GameTime>
        </BestSegmentTime>`;
    }

    body += `
    <Segment>
      <Name>${escapedName}</Name>
      <Icon />
      <SplitTimes>
        ${splitTimeXml}
      </SplitTimes>
      ${bestSegmentTimeXml}
      ${segHistoryXml}
    </Segment>`;
  }

  return head + body + tail;
}

// --- Build pre-.lss map_times.txt lines (map\t ticks \t sec \t snapped_cum) — uses same cumulative including offset
function buildMapTimesLines(groups: { map: string; ticks: number; files: string[]; finished: boolean; valid?: boolean; hasEscape?: boolean }[]) {
  const lines: string[] = [];
  let cumulativeSec = PARSER_OFFSET_SEC;

  for (const mapId of MAP_LIST) {
    const g = groups.find(x => x.map === mapId);
    if (!g) {
      if (FORCE_ALWAYS_FINISHED.has(mapId)) {
        const forcedSec = (forcedTimes as any)[mapId] ?? 0;
        const forcedTicks = findBestTicksForSeconds(forcedSec);
        cumulativeSec += forcedSec;
        const snapped = formatClockWithSnap(cumulativeSec);
        lines.push(`${mapId}\t${forcedTicks}\t${forcedSec.toFixed(3)}\t${snapped}`);
      } else {
        lines.push(`${mapId}\t0\t0.000\t-`);
      }
      continue;
    }
    if (FORCE_ALWAYS_FINISHED.has(mapId)) {
      const forcedSec = (forcedTimes as any)[mapId] ?? 0;
      const forcedTicks = findBestTicksForSeconds(forcedSec);
      cumulativeSec += forcedSec;
      const snapped = formatClockWithSnap(cumulativeSec);
      lines.push(`${mapId}\t${forcedTicks}\t${forcedSec.toFixed(3)}\t${snapped}`);
      continue;
    }

    const segSec = ticksToSeconds(g.ticks);
    cumulativeSec += segSec;
    const snapped = formatClockWithSnap(cumulativeSec);
    lines.push(`${mapId}\t${g.ticks}\t${segSec.toFixed(3)}\t${snapped}`);
  }
  return lines;
}

// --- Main flow ---
(async () => {
  console.log(`Using max file size: ${maxSizeMB}MB (${maxSizeBytes} bytes)`);
  console.log(`Minimum gold time check (raw per-map total): ${MIN_GOLD_TIME}s`);
  console.log(`Parser offset applied to cumulative/display times: ${PARSER_OFFSET_SEC}s`);

  if (goldMode) {
    console.log("Gold mode: scanning runs for best splits using new finished logic...");
    try {
      const goldSplits = await processAllRunsForGold(demosDir);

      const goldLines: string[] = [];
      goldLines.push("Map\tBest_Ticks\tBest_Seconds\tRun_Folder\tFormatted_Time");

      for (const mapName of MAP_LIST) {
        const best = goldSplits.get(mapName);
        if (best) {
          let seconds = ticksToSeconds(best.ticks);
          // For first map display we add parser offset (but raw ticks used for comparison)
          if (mapName === MAP_LIST[0]) seconds += PARSER_OFFSET_SEC;
          const formatted = formatClockWithSnap(seconds);
          goldLines.push(`${mapName}\t${best.ticks}\t${seconds.toFixed(3)}\t${best.runName}\t${formatted}`);
        } else {
          goldLines.push(`${mapName}\t-\t-\t-\t-`);
        }
      }

      const goldOutFile = `${outBase}_splits_gold.txt`;
      await Deno.writeTextFile(goldOutFile, goldLines.join("\n"));
      console.log(`Gold summary written to ${goldOutFile}`);
      console.log(`Found ${goldSplits.size} valid gold splits out of ${MAP_LIST.length} maps`);
    } catch (err) {
      console.error("Error in gold mode:", err);
    }
    return;
  }

  // Normal mode: process given folder and write outputs
  const result = await processRunFolder(demosDir, "current_run");
  if (!result) {
    console.error("No valid demo data found in directory");
    Deno.exit(3);
  }

  const groups = result.groups;
  applyForcedTimes(groups);

  // 1) write map_times.txt (old pre-lss formatting). Rightmost column = cumulative snapped time including offset
  const mapLines = buildMapTimesLines(groups);
  try {
    await Deno.writeTextFile(mapTimesOutFile, mapLines.join("\n"));
    console.log(`Wrote map-times to ${mapTimesOutFile}`);
  } catch (err) {
    console.error("Failed to write map_times.txt:", err);
  }

  // 2) load golds (if present) and apply to .lss
const goldsMap = parseGoldsFileCandidates(outBase);
if (goldsMap && goldsMap.size > 0) {
  console.log(`Using ${goldsMap.size} gold splits from file`);
}

// FIXED: Pass goldsMap without changing any time calculation logic
const lss = buildLssXmlFromGroups(groups, goldsMap ?? undefined);
  try {
    await Deno.writeTextFile(lssOutFile, lss);
    console.log(`Wrote LiveSplit .lss to ${lssOutFile}`);
  } catch (err) {
    console.error("Failed to write .lss output file:", err);
  }
})();

