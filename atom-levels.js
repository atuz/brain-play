// Original, fixed puzzles. Rebuild with node dev/build-atom-levels.mjs.
export const atomLevels=[
  {
    "id": "a01",
    "name": "氢气",
    "formula": "H₂",
    "w": 6,
    "h": 6,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "H",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      }
    ],
    "chapter": "初识",
    "minimum": 2,
    "reachableStates": 210
  },
  {
    "id": "a02",
    "name": "水",
    "formula": "H₂O",
    "w": 6,
    "h": 6,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 2,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "H",
        "x": 3,
        "y": 3,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      }
    ],
    "chapter": "初识",
    "minimum": 4,
    "reachableStates": 2184
  },
  {
    "id": "a03",
    "name": "二氧化碳",
    "formula": "CO₂",
    "w": 6,
    "h": 6,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "O",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "O",
        "x": 2,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "O",
        "x": 2,
        "y": 4,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 4,
        "y": 1,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "O",
        "x": 4,
        "y": 3,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      }
    ],
    "chapter": "初识",
    "minimum": 5,
    "reachableStates": 2184
  },
  {
    "id": "a04",
    "name": "氨",
    "formula": "NH₃",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "N",
        "x": 1,
        "y": 1,
        "bonds": [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 2,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "N",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 5,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 3,
        "y": 4,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      }
    ],
    "solution": [
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "up"
      }
    ],
    "chapter": "初识"
  },
  {
    "id": "a05",
    "name": "甲烷",
    "formula": "CH₄",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 3,
        "y": 2,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 2,
        "y": 4,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 3,
        "y": 4,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "left"
      }
    ],
    "chapter": "初识"
  },
  {
    "id": "a06",
    "name": "氧气",
    "formula": "O₂",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "O",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          2,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 0,
        "y": 1,
        "bonds": [
          2,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "O",
        "x": 4,
        "y": 5,
        "bonds": [
          0,
          0,
          0,
          0,
          2,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 2,
        "y": 1,
        "bonds": [
          2,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "up"
      }
    ],
    "chapter": "初识",
    "minimum": 6,
    "reachableStates": 462
  },
  {
    "id": "a07",
    "name": "氮气",
    "formula": "N₂",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "N",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          3,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "N",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          3,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "N",
        "x": 5,
        "y": 3,
        "bonds": [
          0,
          0,
          3,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "N",
        "x": 1,
        "y": 3,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          3,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      }
    ],
    "chapter": "连接",
    "minimum": 6,
    "reachableStates": 506
  },
  {
    "id": "a08",
    "name": "氯化氢",
    "formula": "HCl",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "Cl",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "H",
        "x": 5,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "Cl",
        "x": 1,
        "y": 3,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      }
    ],
    "chapter": "连接",
    "minimum": 5,
    "reachableStates": 462
  },
  {
    "id": "a09",
    "name": "过氧化氢",
    "formula": "H₂O₂",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "O",
        "x": 1,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "O",
        "x": 2,
        "y": 4,
        "bonds": [
          1,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      }
    ],
    "chapter": "连接"
  },
  {
    "id": "a10",
    "name": "乙炔",
    "formula": "C₂H₂",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          3,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "C",
        "x": 2,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          3,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 3,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 3,
        "y": 4,
        "bonds": [
          0,
          0,
          3,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "C",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          3,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "up"
      }
    ],
    "chapter": "连接"
  },
  {
    "id": "a11",
    "name": "甲醛",
    "formula": "CH₂O",
    "w": 7,
    "h": 7,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          1,
          0,
          1
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 0,
        "y": 2,
        "bonds": [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          1,
          0,
          1
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 4,
        "y": 4,
        "bonds": [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "up"
      }
    ],
    "chapter": "连接"
  },
  {
    "id": "a12",
    "name": "甲醇",
    "formula": "CH₃OH",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 2,
        "y": 5,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "O",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 6,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 2,
        "y": 3,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 2,
        "y": 4,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "down"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "down"
      },
      {
        "id": "a5",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a5",
        "direction": "right"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "down"
      },
      {
        "id": "a4",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a5",
        "direction": "up"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a5",
        "direction": "up"
      }
    ],
    "chapter": "连接"
  },
  {
    "id": "a13",
    "name": "乙烯",
    "formula": "C₂H₄",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          1,
          0,
          1
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          1,
          0,
          1,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 0,
        "y": 2,
        "bonds": [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 3,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          2,
          0,
          0,
          1,
          0,
          1
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          1,
          0,
          1,
          0,
          0,
          2,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 3,
        "y": 3,
        "bonds": [
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 5,
        "y": 4,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 4,
        "y": 3,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1
        ]
      }
    ],
    "solution": [
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a5",
        "direction": "down"
      },
      {
        "id": "a4",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a4",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "up"
      },
      {
        "id": "a3",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "left"
      }
    ],
    "chapter": "实验室"
  },
  {
    "id": "a14",
    "name": "四氟化碳",
    "formula": "CF₄",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "F",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "F",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "F",
        "x": 1,
        "y": 2,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "F",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 4,
        "y": 2,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "F",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "F",
        "x": 6,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a3",
        "element": "F",
        "x": 2,
        "y": 4,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "F",
        "x": 2,
        "y": 3,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a4",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "left"
      }
    ],
    "chapter": "实验室"
  },
  {
    "id": "a15",
    "name": "彩晶十字",
    "formula": "◆",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "red",
        "x": 1,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "blue",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "gold",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "green",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "purple",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "red",
        "x": 5,
        "y": 4,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "blue",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "gold",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "green",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "purple",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a4",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a4",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "right"
      }
    ],
    "chapter": "实验室"
  },
  {
    "id": "a16",
    "name": "乙烷",
    "formula": "C₂H₆",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "C",
        "x": 1,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 2,
        "y": 1,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 0,
        "y": 1,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a6",
        "element": "H",
        "x": 2,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a7",
        "element": "H",
        "x": 2,
        "y": 2,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "C",
        "x": 6,
        "y": 4,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a1",
        "element": "C",
        "x": 3,
        "y": 2,
        "bonds": [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 1,
        "y": 6,
        "bonds": [
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "H",
        "x": 5,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "H",
        "x": 3,
        "y": 4,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "H",
        "x": 6,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a6",
        "element": "H",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a7",
        "element": "H",
        "x": 6,
        "y": 5,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a4",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a3",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "up"
      },
      {
        "id": "a7",
        "direction": "up"
      },
      {
        "id": "a7",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a4",
        "direction": "left"
      },
      {
        "id": "a7",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "down"
      },
      {
        "id": "a5",
        "direction": "down"
      },
      {
        "id": "a5",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a3",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a4",
        "direction": "up"
      }
    ],
    "chapter": "实验室"
  },
  {
    "id": "a17",
    "name": "弯曲水桥",
    "formula": "H₂O",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "O",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 0,
        "y": 1,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "O",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "H",
        "x": 1,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "id": "a2",
        "element": "H",
        "x": 5,
        "y": 1,
        "bonds": [
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "left"
      }
    ],
    "chapter": "实验室",
    "minimum": 9,
    "reachableStates": 32736
  },
  {
    "id": "a18",
    "name": "彩晶阶梯",
    "formula": "◆",
    "w": 8,
    "h": 8,
    "tiles": [
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "wall",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "ground",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall",
      "wall"
    ],
    "goal": [
      {
        "id": "a0",
        "element": "red",
        "x": 0,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "gold",
        "x": 1,
        "y": 0,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "green",
        "x": 1,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "blue",
        "x": 2,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "purple",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "white",
        "x": 3,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "atoms": [
      {
        "id": "a0",
        "element": "red",
        "x": 3,
        "y": 3,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a1",
        "element": "gold",
        "x": 2,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a2",
        "element": "green",
        "x": 1,
        "y": 5,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a3",
        "element": "blue",
        "x": 3,
        "y": 1,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a4",
        "element": "purple",
        "x": 3,
        "y": 4,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "id": "a5",
        "element": "white",
        "x": 4,
        "y": 2,
        "bonds": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ],
    "solution": [
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a5",
        "direction": "right"
      },
      {
        "id": "a4",
        "direction": "up"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a1",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a5",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "left"
      },
      {
        "id": "a1",
        "direction": "up"
      },
      {
        "id": "a1",
        "direction": "right"
      },
      {
        "id": "a2",
        "direction": "right"
      },
      {
        "id": "a0",
        "direction": "left"
      },
      {
        "id": "a3",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "down"
      },
      {
        "id": "a2",
        "direction": "up"
      },
      {
        "id": "a0",
        "direction": "up"
      },
      {
        "id": "a5",
        "direction": "left"
      }
    ],
    "chapter": "实验室"
  }
];
