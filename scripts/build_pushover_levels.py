#!/usr/bin/env python3
"""Build the 101 original Pushover levels for the brain-play domino engine.

Source data: analysis/levels_all.json from the Pushover level extraction
(20x13 grid, domino characters, entry/exit doors).  The output is a JS module
consumed by domino-levels.js; the geometry is the original DOS layout.

Run:  python3 scripts/build_pushover_levels.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = "/Users/pingzheng/Downloads/pushover_levels/analysis/levels_all.json"
OUT = os.path.join(ROOT, "domino-levels-pushover.js")

SIZE = 20, 13
TYPE = {
    "I": "normal", "#": "stopper", "Y": "splitter", "*": "exploder",
    "?": "delay", "O": "tumbler", "=": "bridge", ":": "vanish",
    "!": "trigger", "A": "ascender",
}
PIECE_CHARS = set(TYPE) | set("Xxabc")
PLATFORM_CHARS = set("_") | PIECE_CHARS

THEME_CHAPTER = {
    "toxcity": 6, "aztec": 7, "space": 8, "electro": 9, "greek": 10,
    "castle": 11, "mechanic": 12, "dungeon": 13, "japanese": 14, "cavern": 15,
}
THEME_ZH = {
    "toxcity": "毒城", "aztec": "阿兹特克", "space": "太空",
    "electro": "电子世界", "greek": "希腊", "castle": "古堡",
    "mechanic": "机械", "dungeon": "地牢", "japanese": "东方",
    "cavern": "洞窟",
}
THEME_EN = {
    "toxcity": "Toxcity", "aztec": "Aztec", "space": "Space",
    "electro": "Electro", "greek": "Greek", "castle": "Castle",
    "mechanic": "Mechanic", "dungeon": "Dungeon", "japanese": "Japanese",
    "cavern": "Cavern",
}


def load_solutions():
    import csv
    path = "/Users/pingzheng/Downloads/pushover_levels/攻略总表.csv"
    out = {}
    with open(path, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            out[int(row["level"])] = row.get("solution", "").strip()
    return out


def build(level):
    """Return platforms, ladders, pieces, player, exit for one DOS level."""
    grid = [list(r.ljust(20)[:20]) for r in level["grid"]]
    H, W = 13, 20
    cells = [[False] * W for _ in range(H)]
    stair_cells = set()
    ladders_raw = [[False] * W for _ in range(H)]
    pieces = []
    doors = {}

    for y in range(H):
        for x in range(W):
            ch = grid[y][x]
            if ch in PLATFORM_CHARS or ch in "._$":
                cells[y][x] = True
            if ch in PIECE_CHARS:
                pieces.append({"type": TYPE.get(ch, "normal"), "x": x, "y": y})
            if ch in "12":
                doors[ch] = (x, y)
            if ch in "HV":
                ladders_raw[y][x] = True
            if ch == "/":
                if y > 0:
                    if x + 1 < W:
                        cells[y - 1][x + 1] = True
                    stair_cells.add((x, y - .5))
            if ch == "\\":
                if y > 0 and x > 0:
                    cells[y - 1][x - 1] = True
                    stair_cells.add((x, y - .5))

    # Ladder and floor are independent terrain. H/V provides climbing only;
    # neighbouring floor must never fill an open ladder cell automatically.

    # Doors: the ant stands on the platform tile below the door sprite.  Six
    # levels have a door without a tile below; use the door cell itself.
    player = exit_ = None
    for key, (x, y) in doors.items():
        target = (x, y + 1) if y + 1 < H and cells[y + 1][x] else (x, y)
        if target[1] == y:
            cells[y][x] = True
        if key == "1":
            player = {"x": target[0], "y": target[1]}
        else:
            exit_ = {"x": target[0], "y": target[1]}

    platforms = []
    for y in range(H):
        x = 0
        while x < W:
            if cells[y][x]:
                start = x
                while x + 1 < W and cells[y][x + 1]:
                    x += 1
                platforms.append([y, start, x])
            x += 1

    # Merge ladder fragments that cross platform rows into one continuous
    # ladder, extending to the platform directly above/below.
    ladders = []
    for x in range(W):
        rows = [y for y in range(H) if ladders_raw[y][x]]
        if not rows:
            continue
        groups, cur = [], [rows[0]]
        for y in rows[1:]:
            gap = y - cur[-1]
            if gap == 1:
                cur.append(y)
            elif gap == 2 and cells[cur[-1] + 1][x]:
                cur.append(y)
            else:
                groups.append(cur)
                cur = [y]
        groups.append(cur)
        for group in groups:
            top, bottom = group[0], group[-1]
            if top > 0 and cells[top - 1][x] and not ladders_raw[top - 1][x]:
                top -= 1
            if bottom + 1 < H and cells[bottom + 1][x] and not ladders_raw[bottom + 1][x]:
                bottom += 1
            ladders.append({"x": x, "from": top, "to": bottom})

    # A slash encodes two treads: the far one is a full row higher,
    # the near one half a row higher. Decode both orientations uniformly.
    platforms.extend([y,x,x] for x,y in stair_cells)
    platforms.sort()
    ramps = []
    entry = doors.get('1')
    return platforms, ladders, pieces, player, exit_, ramps, entry


def reachable(level):
    """BFS over the same rules as domino-engine.hasFloor/neighbors."""
    W, H = level["width"], level["height"]
    floors = set()
    for y, a, b in level["platforms"]:
        for x in range(a, b + 1):
            floors.add((x, y))
    ladders = level["ladders"]

    def on_ladder(x, y):
        return any(l["x"] == x and l["from"] <= y <= l["to"] for l in ladders)

    def walkable(x, y):
        return 0 <= x < W and 0 <= y < H and ((x, y) in floors or on_ladder(x, y))

    start = (level["player"]["x"], level["player"]["y"])
    goal = (level["exit"]["x"], level["exit"]["y"])
    seen = {start}
    queue = [start]
    while queue:
        x, y = queue.pop()
        nxt = []
        for dx in (-1, 1):
            if (x, y) in floors and (x + dx, y) in floors:
                nxt.append((x + dx, y))
        for dy in (-1, 1):
            if any(l["x"] == x and min(y, y + dy) >= l["from"] and max(y, y + dy) <= l["to"] for l in ladders):
                nxt.append((x, y + dy))
        for p in nxt:
            if p not in seen:
                seen.add(p)
                queue.append(p)
    return goal in seen, seen


def dos_source(n):
    """Map the user's DOS level number to the level file that matches it.

    Levels 1-80 use the same-numbered file.  From the user's DOS level 81 the
    reimplementation's numbering runs one behind (verified against the original
    DOS screens captures): DOS 82..101 use files 81..100.  The reimplementation's
    extra level 101 is not part of the DOS progression.
    """
    return n if n <= 80 else n - 1


def load_passcodes():
    patches = {}
    path = "/Users/pingzheng/Downloads/pushover_levels/passwords.txt"
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"Level\s+(\d+)\s*:\s*(\d+)", line.strip())
            if m:
                patches[int(m.group(1))] = m.group(2).zfill(5)
    return patches


def main():
    with open(SRC, encoding="utf-8") as f:
        source_levels = sorted(json.load(f), key=lambda l: l["level"])
    by_level = {lv["level"]: lv for lv in source_levels}
    solutions = load_solutions()
    patches = load_passcodes()

    out = []
    problems = []
    for dos in range(1, 102):
        src = by_level[dos_source(dos)]
        platforms, ladders, pieces, player, exit_, ramps, entry = build(src)
        theme = src.get("theme", "toxcity")
        entry = {
            "dos": dos,
            "source": src["level"],
            "name": f'{THEME_ZH.get(theme, theme)} {dos:02d}',
            "chapter": THEME_CHAPTER.get(theme, 6),
            "theme": theme,
            "passcode": patches.get(dos, ""),
            "dosMode": True,
            "hint": solutions.get(src["level"], ""),
            "width": 20, "height": 13, "viewTop": 0,
            "player": player, "exit": exit_,
            "entry": {"x": entry[0], "y": entry[1]} if entry else None,
            "platforms": platforms, "ladders": ladders, "ramps": ramps, "pieces": pieces,
        }
        ok, seen = reachable(entry)
        if not ok:
            problems.append((dos, len(seen), len(pieces)))
        out.append(entry)

    lines = [
        "// Generated by scripts/build_pushover_levels.py from the original",
        "// Pushover level files (20x13). Do not edit by hand.",
        "// Each entry maps to the user's DOS level; see dos_source() in the generator.",
        "export const pushoverDefinitions = [",
    ]
    for lv in out:
        pieces = ",".join(
            "{type:'%s',x:%d,y:%d}" % (p["type"], p["x"], p["y"])
            for p in lv["pieces"]
        )
        platforms = ",".join("[%g,%d,%d]" % tuple(p) for p in lv["platforms"])
        ladders = ",".join(
            "{x:%d,from:%d,to:%d}" % (l["x"], l["from"], l["to"]) for l in lv["ladders"]
        )
        ramps = ",".join("[%d,%d]" % tuple(r) for r in lv["ramps"])
        hint = lv["hint"].replace("\\", "\\\\").replace("'", "\\'")
        name = lv["name"].replace("'", "\\'")
        lines.append("  {")
        lines.append(f"    name:'{name}',chapter:{lv['chapter']},theme:'{lv['theme']}',")
        lines.append(f"    passcode:'{lv['passcode']}',dos:true,hint:'{hint}',")
        lines.append(f"    width:{lv['width']},height:{lv['height']},viewTop:{lv['viewTop']},")
        lines.append(f"    player:{{x:{lv['player']['x']},y:{lv['player']['y']}}},")
        if lv.get("entry"):
            lines.append(f"    entry:{{x:{lv['entry']['x']},y:{lv['entry']['y']}}},")
        lines.append(f"    exit:{{x:{lv['exit']['x']},y:{lv['exit']['y']}}},")
        lines.append(f"    platforms:[{platforms}],")
        lines.append(f"    ladders:[{ladders}],ramps:[{ramps}],")
        lines.append(f"    pieces:[{pieces}],")
        lines.append("  },")
    lines.append("];")
    lines.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    # English text for the new levels: names and the original DOS hints.
    i18n_lines = [
        "// Generated by scripts/build_pushover_levels.py.",
        "export const pushoverEnglish = {",
    ]
    seen = set()
    for lv in out:
        src = by_level[lv["source"]]
        en_name = f"{THEME_EN.get(lv['theme'], 'Level')} {lv['dos']:02d}"
        pairs = [(lv["name"], en_name), (lv["hint"], src.get("hint", "").strip())]
        for zh, en in pairs:
            if not zh or zh in seen:
                continue
            seen.add(zh)
            en = en.replace("\\", "\\\\").replace("'", "\\'")
            zh = zh.replace("\\", "\\\\").replace("'", "\\'")
            i18n_lines.append(f"  '{zh}':'{en}',")
    i18n_lines.append("};")
    i18n_lines.append("")
    with open(os.path.join(ROOT, "domino-i18n-pushover.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(i18n_lines))

    print("wrote", OUT)
    print("levels", len(out))
    print("mapping: 1-80 -> file N, 81-101 -> file N-1")
    print("unreachable exits:", len(problems))
    for p in problems:
        print("  DOS level %d: reached %d cells, %d pieces" % p)


if __name__ == "__main__":
    main()
