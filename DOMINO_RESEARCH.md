# Domino-Chain research and the larger local edition

Checked on 2026-10-21 against the official repository, commit `16826d3ec2b2df78ad46b76b2b6e6a0d2175c417`. Reference checkout is outside this project. No source, levels or assets were imported into the game.

## Verified reference facts

- [Tutorial index](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/levels/tutorial/index.level): 4 entries.
- [A&V index](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/levels/av/index.level): 62 new puzzles.
- [Original index](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/levels/original/index.level): 100 numbered levels plus the 091 SNES variation, 101 entries. Its description requires the player's original Pushover resources. Total across the three indexes: 167 entries, not 167 independently available new puzzles.
- [Level parser](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/leveldata.cpp): fixed 20-column, 25-row logical grid (`LEVELSIZE_V1_X/Y` and the version-2 size checks).
- [Graphics header](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/graphicsn.h): 800×600 display; background blocks are 40×48 pixels. The [official page](https://domino-chain.gitlab.io/#graphics) describes 20×13 background tiles. Those background tiles are distinct from the 25 logical gameplay rows.
- The official rules combine different domino behaviors, platform routes, a single push and a trigger that must fall last. This local edition retains its own six-type rule engine and original layouts.

## Local design

| Chapter | Levels | Stage | Relay floors | Recorded transfers per solution |
| --- | --- | --- | --- | --- |
| Basics | 1–12 | 9×7 | 1–2 | Existing tutorial puzzles |
| Intermediate | 13–18 | 13×13 | 3 | 4–6 |
| Challenge | 19–24 | 17×17 | 4 | 7–9 |
| Expert | 25–30 | 21×21 | 5 | 10–12 |
| Finale | 31–36 | 25×25 | 6 | 13–15 |

These are fixed puzzles assembled from original relay designs with deterministic variations, not random difficulty. Transfer counts describe the recorded solutions, not proven minimum moves or an exact difficulty ranking. Growing stages add switchback drops, more splitters, bridge detours, buffer swaps and a shorter trigger branch whose delays must outlast the longer branch.

Placement is free, except for the existing trigger/door restrictions. Multiple winning type arrangements are allowed; identical dominoes are interchangeable. There is no uniqueness requirement, fixed-domino mechanic or prescribed placement-slot domain.

Every level includes an executable legal solution. Tests also replace all delays with regular dominoes to check that the final timing problem is real: all dominoes still fall, but the trigger is too early or simultaneous.

Large stages keep the normal close-up tile size. Drag to pan; pinch or use ± to zoom; Overview fits the whole stage, and ◎ resumes ant following. Moving the ant (arrows, keyboard, tap-to-walk) or starting a chain automatically resumes following at the current zoom. Manual inspection stays put while the player is idle. Small stages retain swipe movement. Camera transforms do not change logical grid coordinates or saved-game format.

This batch stays local until a later combined publication. The existing first twelve levels and their indexes are retained for saved-game compatibility.

The user also supplied [the original DOS Push-Over browser emulator](https://bestdosgames.com/games/push-over/play). Entered its language/configuration menus and first industrial-themed level to inspect the presentation. This was visual reference work, not a claim to have completed or audited every original level.

## Running Domino-Chain on this Mac (2026-10-21)

- Downloaded the official 1.1 Windows archive linked by the project website. It includes ready-made graphics, sounds and FreeSans. The website supplies no Mac binary.
- Built the checked-out official `1.2~dev` source natively on x86_64 macOS with Clang C++17, SDL2/image/mixer/ttf, Lua, Boost, FriBidi, libpng and gettext. Used the downloaded package's portable data directory; no original Push-Over resources were needed for the tutorial and A&V levels.
- Actually ran the graphical executable with its official `-R` replay option for `Level Goal, Movement`, `Jumping`, `The Trigger`, `Trigger rules` and `Dominik 1`. All five returned the engine's `LS_solved` state and exited successfully. This is execution of official recorded gameplay, not a claim to have manually solved them with a keyboard.
- Reference-only instrumentation exported the game's SDL framebuffer and logged the terminal result. It did not change movement, timing rules, level data or the recorded inputs. The build, archive, assets and captures are outside this repository.
- The original renderer shows the complete fixed 800×600 level throughout ladder movement and domino arrangement; it does not use this web edition's cropped, pannable camera. The failure to resume camera tracking after a manual inspection was a bug in our local edition.

## Full built-in level replay sweep (2026-10-21)

At the user's request, continued through the complete current tutorial and A&V indexes in order: **4/4 tutorials and 62/62 A&V levels solved; 66/66 total, zero failures**. The last four levels (`Quantum Theory`, `Quantum Theory 2`, `Quantum Timing`, `Missing Quantum`) all returned `LS_solved`; the final A&V entry, `Missing Quantum`, was reached and completed.

Each indexed level was matched by name to one official `src/recordings/finish` recording and executed in the actual graphical game binary with `-R`. Success required both exit code zero and the instrumented engine's explicit `LS_solved` result, rather than assuming a clean exit meant a win. SDL dummy video/audio drivers avoided repeatedly opening desktop windows; the game still rendered its own framebuffer. Late-level captures show the final chain and open exit.

Used the current source checkout's `.level` files in a separate portable QA data directory, alongside the official Windows package's graphics and fonts. The older 1.1 packed levels use different names for several Timo levels, so they were not mixed with the current recording/name index. No puzzle rules or recorded inputs were modified. The original Push-Over resource-dependent level set was outside this sweep.

Machine-readable results and final-level frame exports were saved outside the web repository. This is official recorded-input playback, not a claim that the agent independently solved all 66 puzzles by hand. No game implementation changes or publication occurred during this sweep.

## Frame-by-frame motion and scenery study (2026-10-21)

### Evidence and a replay-method correction

The main program's `-R` shortcut stops at its first non-undecided result. On the two domino-free tutorials, the engine can return `LS_solved` before the figure has appeared, so the first replay sweep alone did not demonstrate their actual walking. For this study, a reference-only harness executed **every event in all 66 complete official recordings**, using the same `figure_c`, `levelPlayer_c`, renderer and assets. It required a visible entry and an actual in-time solved exit after entry, then checked the official test's terminal invariants after 100 settling ticks: figure gone, dominoes fallen, no rubble. **66/66 passed again**, now with complete-record coverage. The game's rules and recorded inputs were unchanged.

Captured native frames at the program's normal 18 simulation ticks/second and exported trace rows containing animation ID/frame, logical position, carried type and input. Short GIFs are crops of actual rendered gameplay, enlarged for inspection; they are not reconstructed character animations.

### What the character actually does

Primary sources: [figure state machine](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/figure.cpp), [animation states](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/figure.h), [sprite and carried-domino rendering](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/graphicsn.cpp).

| Action | Verified implementation | Consequence for our mobile edition |
| --- | --- | --- |
| Empty-handed walking | Six directional images per walk cycle; limb pose and sprite offsets create the travel before the logical cell updates. | Animate feet, arms and body together; a rigid character translating with a bob is insufficient. |
| Ladder climbing | Eight images per climb cycle, with intermediate vertical offsets. Multiple ladder states handle entry, alternating poses and leaving. | Align hands/feet to rungs and handle stepping onto/off platforms. |
| Carrying | Separate walk, slope/step, ladder and idle poses. A per-frame table controls the bone's position and orientation; it is drawn separately with the figure. | Keep a readable full-size bone held at the hands, with arms bracing it and legs free to move. It should not float as a small badge over the head. |
| Picking up | Fifteen images in each direction; reaches to the floor bone, draws it out and settles into the carry pose. Pickup sound is triggered within the action. | Make the floor-to-hands transfer visible; change logical ownership once and block conflicting actions during the transfer. |
| Putting down | Sixteen images in the full directional sequence, with a shorter entry when already at the destination. The carried bone becomes a floor bone at the end. | Lower and align the bone, release it, then restore the idle pose. Avoid a disappearance/reappearance between unrelated locations. |
| Pushing | Seven-image entry into the domino row, followed by a twelve-image base push. The second push frame attempts contact with the adjacent stone. Delays, stoppers/counters and ascenders can branch into additional dedicated responses. | Position the hands first, synchronize contact with the start of the chain, then recover. Different stone behavior deserves different feedback. |
| Doors and success | Separate entry, stepping aside, entering the exit, closing doors and victory poses. A solved result normally follows the exit closing with the figure gone. | Show the complete entrance/exit sequence and a clear finish, rather than ending at the first open-door event. |

Ladder occlusion also changes with pose: a climbing figure is drawn in front of the ladder, while a passing figure can be behind it. The artwork itself is uneven: many poses in the distributed `figure.png` are black-and-white silhouettes. The useful reference is the complete action and contact system; those placeholder silhouettes are not a visual target for our ant.

### Themes and backgrounds

The source has nine named theme resource sets: `aztec`, `castle`, `dungeon`, `electro`, `greek`, `japanese`, `mechanic`, `space`, `toxcity`. The current 66 built-in levels use **seven** of them; `castle` and `greek` are not used by those levels. Verified that every theme PNG, `figure.png` and `box.png` in the downloaded 1.1 package is byte-for-byte identical to the inspected current-source assets.

Actual rendered examples show five substantially illustrated environments: industrial city (`toxcity`), stone ruins (`aztec`), dungeon, circuit board (`electro`) and construction/metal mechanism (`mechanic`). The sampled `space` and `japanese` levels still have black placeholder backgrounds and generic-looking platforms. Theme names alone therefore overstate the amount of finished scenery.

Themes select platform pieces, ladders, animated door frames and background tiles together. Each level places background tiles and foreground geometry independently, so a theme is more than a flat color and does not force the same map composition. Most scenic detail is static; foreground contrast and legible holes/edges remain important. Source: [theme resources](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/tree/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/themes), [level background renderer](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/graphicsn.cpp).

### Switching scenes

The regular program closes the exit, shows the congratulations/Continue window, returns to level selection, then reveals the selected new scene. `screen_c::flipAnimate` performs a **64-step transition**, normally about 3.6 seconds at 18 ticks/second. It randomly chooses among five tile-reveal schedules and fifteen tile-update effects, including horizontal/vertical wipes, expanding/shrinking areas, checkerboard and windmill patterns. It is a reveal of a full new scene, not a camera following the ant into another part of the same map.

A reference-only transition harness rendered an actual industrial level, loaded an actual Japanese-theme level, and invoked the original `flipAnimate` function for all 64 steps. Exported frames show the old scene being replaced tile by tile. This validates the rendering effect; it is not a claim that the agent manually navigated the original menus. Sources: [transition renderer](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/screen.cpp), [menu/level flow](https://gitlab.com/domino-chain/domino-chain.gitlab.io/-/blob/16826d3ec2b2df78ad46b76b2b6e6a0d2175c417/src/domino-chain/main.cpp).

### Concrete local gaps identified

The current local edition has a single ant drawing with translation/bobbing, a reduced held-bone badge, immediate carry/place changes, no reach/contact/recovery push sequence, and mostly gradients/recolored scenery. Improving it calls for independent action poses, a hand-bound full-size bone, synchronized contact, door/finish actions, and complete original scene themes whose platforms, ladders and doors share materials. These are identified implementation requirements; this research pass did not claim they have already been implemented.

For a mobile adaptation, shorter reveals (roughly 0.4–0.7 seconds) and skippable/reduced motion would be reasonable design choices, rather than copying the original's 3.6-second transition duration. This timing is a proposal, distinct from the measured reference behavior. Reference exports stay outside the game source; no reference sprites, level data or theme art were imported into the product.

## Subsequent local character implementation

After the user explicitly requested the changes, implemented an independently drawn articulated SVG ant in `domino-actor.js`: separate walking legs and working arms, climbing/carrying poses, full-size hand-bound domino, pickup/place transfers, reach-before-contact push and recoil, and entering the exit before recording victory. The controller cancels stale actions on undo/navigation; movement queues only the latest requested change of direction/target. The larger character is kept inside the map edges and camera safe area at high zoom.

Completed actual browser playthroughs in both pushing directions, pickup and push cancellation, restored progress, motion disabled, narrow English layout and high-zoom climbing. All 86 automated tests pass. Original reference artwork and code remain outside the product. This implements the character-motion part of the findings; the illustrated scene themes discussed above are still separate future work. This batch remains local and unpublished.
