# Grappling Primitives — Animation Implementation Spec 01

## Purpose

This file is for a separate coding instance that will begin implementing the conceptual animation system.

It translates the prior conceptual discussion into:

- scene architecture
- reusable object model
- state model
- animation primitives
- timing cues
- suggested code structure
- MVP implementation priorities

The target is **simple conceptual animation**, not polished character animation.

---

## 1. Overall Goal

Create a lightweight animation system for conceptual grappling explanations, inspired by 3Blue1Brown-style visual reasoning.

Primary goals:

- explain mechanics, not choreograph realistic grappling
- prioritize clarity over realism
- animate changing body states
- show causality through motion
- make the visual language reusable across multiple episodes

---

## 2. First Deliverable

Implement **Storyboard 01: “Kuzushi Is Not Only Off-Balancing”**.

This first implementation should prove:

1. the visual grammar works
2. the body-state abstractions are readable
3. scenes can be assembled from reusable primitives
4. future episodes can reuse the same framework

---

## 3. Design Principles

### Core rules
- minimal geometry over realism
- one main idea per shot
- body states should be instantly legible
- state change should precede technique label
- use repeated visual motifs across scenes

### Do not optimize first for:
- realistic limb articulation
- realistic gi rendering
- physics-heavy simulation
- perfect tween polish
- complex camera movement

---

## 4. Recommended Technical Scope

### Preferred MVP approach
Use simple 2D or pseudo-2D rendering.

Good candidates:
- HTML / CSS / SVG
- Canvas 2D
- lightweight JS animation framework
- React + SVG if desired
- p5.js if speed matters
- simple Python-rendered SVG/PNG sequences if needed

### Avoid for MVP
- full 3D rigs
- inverse kinematics
- game engine complexity unless already convenient

---

## 5. Reusable Visual Object Model

The system should be built around reusable scene objects.

## 5.1 Grappler mannequin object

A grappler should be a configurable abstract figure.

### Suggested fields

```json
{
  "id": "grappler_A",
  "role": "self",
  "color_theme": "cool",
  "head": {"x": 0, "y": 0, "r": 12},
  "spine": {"x1": 0, "y1": 12, "x2": 0, "y2": 60},
  "shoulders": {"cx": 0, "cy": 18, "width": 36, "angle": 0},
  "hips": {"cx": 0, "cy": 42, "width": 28, "angle": 0},
  "feet": [
    {"x": -12, "y": 84},
    {"x": 12, "y": 84}
  ],
  "base_polygon": [
    [-20, 88],
    [20, 88],
    [12, 76],
    [-12, 76]
  ],
  "cog": {"x": 0, "y": 40},
  "frames": [],
  "opacity": 1
}
```

### Conceptual interpretation
- **head** = directional control / alignment cue
- **shoulders** = upper-axis orientation
- **hips** = lower-axis orientation
- **base polygon** = support footprint
- **CoG** = stability marker
- **frames** = rigid support structures such as arms, knees, shins

---

## 5.2 Frame object

Rigid or semi-rigid support element.

```json
{
  "id": "frame_left_arm",
  "type": "frame",
  "x1": -18,
  "y1": 34,
  "x2": -42,
  "y2": 20,
  "rigidity": 1.0,
  "collapsed": 0.0
}
```

### Meaning
- straight line = strong frame
- bent line = collapsed frame
- opacity / brightness can reflect functional integrity

---

## 5.3 Axis guide object

Used for alignment scenes.

```json
{
  "id": "axis_shoulders",
  "type": "axis",
  "cx": 0,
  "cy": 18,
  "length": 52,
  "angle": 0
}
```

Used for:
- shoulders
- hips
- sometimes spine direction

---

## 5.4 Meter bar object

For the two-body state model.

```json
{
  "id": "meter_balance_A",
  "label": "Balance",
  "value": 0.9,
  "max": 1.0,
  "role": "self"
}
```

Three standard bars per grappler:
- Balance
- Structure
- Alignment

---

## 5.5 Triangle object

For the Kuzushi taxonomy.

```json
{
  "id": "kuzushi_triangle",
  "vertices": [
    {"label": "Alignment", "x": 0, "y": -80},
    {"label": "Structure", "x": -70, "y": 40},
    {"label": "Balance", "x": 70, "y": 40}
  ],
  "center_label": "Kuzushi",
  "highlighted_vertex": null
}
```

---

## 5.6 Arrow object

For pressure, force, directional emphasis.

```json
{
  "id": "pressure_arrow_1",
  "x1": 80,
  "y1": 20,
  "x2": 20,
  "y2": 28,
  "strength": 0.7
}
```

---

## 5.7 Text object

Basic on-screen text.

```json
{
  "id": "caption_1",
  "text": "Kuzushi = Off-balancing",
  "x": 0,
  "y": -140,
  "align": "center",
  "opacity": 1
}
```

---

## 6. State Model

The animation framework should not only store positions. It should store conceptual state.

## 6.1 Grappler state

```json
{
  "balance": 0.95,
  "structure": 0.95,
  "alignment": 0.95
}
```

Recommended normalized range:
- 1.0 = fully functional
- 0.0 = collapsed / failed

### Interpretation
- **balance** = CoG relationship to base of support
- **structure** = frame integrity / compressive resilience
- **alignment** = shoulder-hip-head organization

---

## 6.2 Derived visual rules

These should be computed automatically from state where possible.

### If balance drops
- CoG drifts toward or beyond edge of base polygon
- body tilt increases
- base may flash red if threshold crossed

### If structure drops
- frame lines bend
- torso compresses
- posture may shorten vertically

### If alignment drops
- shoulder angle deviates from hip angle
- head rotates away from spinal line
- twist indicators may appear

---

## 7. Animation Primitives

Build the system from a small number of reusable transitions.

## 7.1 Move CoG
Moves the center-of-gravity dot.

Parameters:
- start position
- end position
- duration
- easing

Use for:
- balance disruption
- restoration

---

## 7.2 Rotate axis
Rotates shoulders, hips, or head.

Use for:
- alignment disruption
- restoration
- demonstrating twist angle

---

## 7.3 Collapse frame
Changes a straight frame into a bent frame.

Use for:
- structure collapse
- pressure-based failure

---

## 7.4 Pulse highlight
Brief emphasis effect on:
- triangle vertex
- base polygon
- alignment angle
- meter bar

---

## 7.5 Meter transition
Smooth value change for:
- Balance
- Structure
- Alignment

---

## 7.6 Text fade
Fade in / fade out captions and labels.

---

## 7.7 Camera / viewport emphasis
MVP version can use:
- scale up a local group
- dim background
- slide scene groups in/out

Avoid fancy camera systems initially.

---

## 8. Scene Breakdown for Storyboard 01

## Scene 1 — Traditional Off-Balancing

### Required objects
- one standing grappler
- one implied or partial opponent
- base polygon
- CoG dot
- title text

### Required transitions
- CoG moves outside base
- body tilts
- base flashes red
- grappler falls or leans enough to imply failure

### Success criterion
Viewer immediately understands:
- this is balance loss
- this is the usual meaning of kuzushi

---

## Scene 2 — Grounded Alignment Disruption

### Required objects
- top grappler
- bottom grappler
- shoulder axis
- hip axis
- head rotation cue
- angle indicator
- caption text

### Required transitions
- head rotates
- shoulder axis rotates
- hips remain more stable
- misalignment angle appears and grows

### Success criterion
Viewer understands:
- something is clearly broken
- but it is not classic off-balancing

---

## Scene 3 — Structural Collapse

### Required objects
- bottom grappler with two arm frames
- top pressure arrow
- torso compression cue
- caption text

### Required transitions
- arrow appears
- arrow intensity increases
- frame bars bend
- torso compresses

### Success criterion
Viewer sees:
- a structural failure under pressure
- another valid form of disruption

---

## Scene 4 — Kuzushi Triangle Reveal

### Required objects
- triangle
- labels
- center title
- optional micro-replay panels

### Required transitions
- triangle fades in
- each vertex highlights in turn
- corresponding mini-example appears or flashes

### Success criterion
Viewer understands the taxonomy:
- Balance
- Structure
- Alignment

---

## Scene 5 — Two Body States

### Required objects
- two grapplers
- six bars total
- labels
- final technique label

### Required transitions
- opponent alignment meter drops
- opponent structure meter drops
- opponent balance meter drops
- technique name appears only after state advantage is visible

### Success criterion
Viewer understands:
- techniques emerge from asymmetry
- state change comes first

---

## Scene 6 — Build Yourself

### Required objects
- single grappler
- base polygon
- CoG dot
- alignment axes
- text

### Required transitions
- spine organizes
- shoulders level
- base widens
- CoG centers
- frames brighten / straighten

### Success criterion
Viewer feels:
- order
- stability
- self-construction
- calm readiness

This scene should feel more satisfying than violent.

---

## Scene 7 — Reframed Doctrine

### Required objects
- text labels: Break / Set / Execute
- optional self and opponent structure cues
- throw arc

### Required transitions
- word sequence appears
- words reorder
- self structure stabilizes
- opponent destabilizes
- execution arc appears

### Success criterion
Viewer understands the reframing:
- Set → Break → Execute

---

## Scene 8 — Final Model

### Required objects
- two triangles or two grouped state diagrams
- final text

### Required transitions
- one structure remains stable
- the other collapses
- final line fades in

### Success criterion
Viewer leaves with:
- grappling is management of two structures

---

## 9. Timing Recommendations

Target total: **120–180 seconds**

Suggested rough timing:

- Scene 1: 12–18s
- Scene 2: 12–18s
- Scene 3: 12–18s
- Scene 4: 15–20s
- Scene 5: 20–30s
- Scene 6: 15–25s
- Scene 7: 12–18s
- Scene 8: 8–15s

### Pacing pattern
Use a repeated rhythm:
1. show
2. pause
3. change
4. pause
5. label
6. resolve

Important: allow time for the viewer to **read the geometry before motion begins**.

---

## 10. Suggested Code Architecture

Keep this modular from the start.

## 10.1 Suggested folders

```text
/src
  /core
    scene.ts
    timeline.ts
    easing.ts
    renderer.ts
  /objects
    grappler.ts
    frame.ts
    axis.ts
    meter.ts
    triangle.ts
    arrow.ts
    textLabel.ts
  /animations
    moveCog.ts
    rotateAxis.ts
    collapseFrame.ts
    pulseHighlight.ts
    tweenMeter.ts
    fadeText.ts
  /scenes
    scene01_traditional.ts
    scene02_alignment.ts
    scene03_structure.ts
    scene04_triangle.ts
    scene05_two_body_states.ts
    scene06_build_yourself.ts
    scene07_doctrine.ts
    scene08_final.ts
  /data
    storyboard01.ts
  /styles
    theme.ts
```

Adapt naming to whatever stack is used.

---

## 10.2 Scene abstraction

Each scene should expose something like:

```ts
type Scene = {
  id: string;
  setup: () => void;
  play: (timeline: Timeline) => void;
  teardown?: () => void;
};
```

---

## 10.3 Timeline abstraction

A simple timeline helper is enough.

```ts
timeline.add({
  target: cogDot,
  property: "x",
  from: 0,
  to: 24,
  duration: 1.2,
  ease: "inOutCubic"
});
```

Also useful:
- play parallel animations
- chain sequences
- insert pauses

---

## 10.4 State-driven rendering

Ideally, visual geometry should be partially derived from conceptual state.

Example:

```ts
grappler.state.alignment = 0.4;
renderAlignment(grappler);
```

Instead of directly hard-coding every visual deformation.

This will help reuse the system for future lessons.

---

## 11. MVP Feature Priority

## Must-have
- abstract grappler rendering
- CoG movement
- base polygon
- shoulder / hip axis rotation
- frame collapse
- meter bars
- triangle highlight
- text fades
- scene transitions

## Nice-to-have
- subtle glow
- gentle wobble on instability
- configurable themes
- export to MP4 / GIF / PNG sequence

## Not needed yet
- realistic grappling animation
- procedural ragdolling
- advanced camera system
- audio sync system

---

## 12. Pseudocode Sketch

```ts
const scene1 = createScene("traditional-off-balance");

scene1.setup(() => {
  addStandingGrappler(opponent);
  addBasePolygon(opponent);
  addCogDot(opponent);
  addText("Kuzushi = Off-balancing");
});

scene1.play((timeline) => {
  timeline.pause(0.6);
  timeline.parallel([
    moveCog(opponent, { x: 0, y: 40 }, { x: 22, y: 40 }, 1.2),
    tiltBody(opponent, 18, 1.2),
    flashBase(opponent, 0.8)
  ]);
  timeline.pause(0.8);
});
```

Another example:

```ts
const scene3 = createScene("structure-collapse");

scene3.setup(() => {
  addGroundGrappler(bottom);
  addFrames(bottom, ["leftArm", "rightArm"]);
  addPressureArrow(topToBottom);
  addText("Structure collapsed");
});

scene3.play((timeline) => {
  timeline.fadeIn(pressureArrow, 0.4);
  timeline.parallel([
    increaseArrowStrength(pressureArrow, 0.3, 1.0, 1.0),
    collapseFrame(bottom.leftArm, 0.0, 0.8, 1.0),
    collapseFrame(bottom.rightArm, 0.0, 0.7, 1.0),
    compressTorso(bottom, 0.0, 0.4, 1.0)
  ]);
});
```

---

## 13. First Prototype Recommendation

Do **not** implement the full storyboard first.

Build these five micro-prototypes first:

### Prototype A
CoG leaving base polygon

### Prototype B
Rigid arm frame collapsing under pressure

### Prototype C
Shoulder axis rotating away from hip axis

### Prototype D
Single body organizing into “Build Yourself”

### Prototype E
Two-body state bars diverging during a simple exchange

If these five are readable, the full storyboard is viable.

---

## 14. Visual Tone Guidance

Desired feeling:
- conceptual
- elegant
- calm
- intellectually satisfying
- more “math explanation” than “sports promo”

Avoid:
- aggressive fight aesthetics
- flame effects
- excessive impact flashes
- cluttered anatomy
- too many simultaneous labels

---

## 15. Future Extension Path

If storyboard 01 works, the same system can support:

- Build Yourself episode
- Kuzushi Triangle deep dive
- State-to-technique episodes
- posture and pressure lessons
- “why experts feel immovable”
- grappling primitives library of reusable concepts

This means the first implementation should be treated as the seed of a broader reusable framework.

---

## 16. Final Working Summary

This system is trying to show that:

- grappling is not primarily a catalog of named moves
- grappling is a changing relationship between two body structures
- self-organization and opponent disruption are the central variables
- named techniques are consequences of state transitions

Compressed teaching line:

> Build yourself.  
> Break them.  
> Execute.
