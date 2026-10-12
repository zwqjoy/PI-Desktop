---
name: genui
description: Render charts, dashboards, forms, quizzes and interactive comparisons inside PI-Desktop conversations when the user requests them.
---

# GenUI for PI-Desktop

Preserve the conversation language in visible labels and surrounding prose.
Use normal Markdown for simple answers. Use GenUI for requested visualization
or interactions. Output JSON in a `local.pi-genui:dsh-ui` fenced block,
with ordinary answer text before or after it. Do not output a bare dsh-ui
fence. The interface is rendered inline as completed components arrive.

Root example: {"title":"Orders","items":[{"type":"stat","label":"Total","value":"42"}]}.
Use the native schema below. Do not invent HTML, JavaScript or callback code.
Call validate_dsh_ui when unsure of a field. render_ui is an optional inline
TOOL channel; a fence is the main response channel.
For either tool, pass spec as a JSON object, never an encoded JSON string:
{"spec":{"items":[{"type":"stat","label":"Total","value":"42"}]}}.
Correct reported validation errors before rendering. Do not write files or
run shell commands merely to construct or validate a GenUI spec.

Local controls sort, filter, expand, adjust plots and grade quizzes without a
model round trip. A component carrying action sends its event to the original
session only after the response settles. On a [genui-action] message, use the
provided action and payload to answer and emit a new fence if appropriate.
Never request passwords, API keys, tokens or recovery codes.

Use actual columns and rows when a record list is requested. Provide actions
only for work that needs the model; buttons without actions are disabled.
Radio groups use group, answer and explanation. Submit groups name required
radio, checkbox and field IDs; collected fields come from IDs across the block.
Math uses KaTeX delimiters; JSON backslashes must be doubled. Plot expressions
use the upstream bounded parser, never JavaScript. Media URLs use HTTPS.

Persistent dock/append and automatic same-turn repair are not implemented in
this development stage; deliver self-contained inline specs instead.

## Resource limits

{
  "maxDepth": 8,
  "maxNodes": 200,
  "maxString": 2000,
  "maxCode": 12000,
  "maxMermaid": 8000,
  "maxGridCols": 12,
  "maxTabs": 12,
  "maxAccordionItems": 24,
  "maxListItems": 50,
  "maxOptions": 50,
  "maxTableRows": 50,
  "maxTableCols": 12,
  "maxChartPoints": 60,
  "maxPlotSeries": 8,
  "maxPlotParams": 6,
  "maxMeshes": 5,
  "maxQuizOptions": 8,
  "maxSteps": 24,
  "maxTimelineItems": 24,
  "maxBreadcrumbItems": 12,
  "maxKeyValuePairs": 24,
  "maxTreeDepth": 6,
  "maxDiagramNodes": 9,
  "maxDiagramEdges": 12,
  "maxDiagramZones": 3,
  "maxDiagramFocal": 2,
  "maxDiagramLabel": 14,
  "maxEChartOptionDepth": 10,
  "maxEChartArrayLen": 500,
  "maxEChartOptionNodes": 2000
}

## Root fields

{
  "required": [
    "items"
  ],
  "fields": {
    "title": "string",
    "gap": "number",
    "panel": "boolean",
    "append": "boolean",
    "items": "nodes"
  },
  "optional": {
    "title": "string",
    "gap": "number",
    "panel": "boolean",
    "append": "boolean"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}

## Native components

### accordion

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "items": {
      "required": [
        "title",
        "items"
      ],
      "fields": {
        "title": "string",
        "items": "nodes"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### audio

```json
{
  "required": [
    "src"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "src": "string",
    "alt": "string",
    "loop": "boolean"
  },
  "optional": {
    "span": "number",
    "alt": "string",
    "loop": "boolean"
  },
  "aliases": {
    "url": "src",
    "link": "src"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### avatar

```json
{
  "required": [
    "name"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "name": "string",
    "color": "string"
  },
  "optional": {
    "span": "number",
    "color": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### badge

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "tone": "string",
    "icon": "string"
  },
  "optional": {
    "span": "number",
    "tone": "string",
    "icon": "string"
  },
  "aliases": {
    "text": "label",
    "value": "label"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "tone": [
      "success",
      "warn",
      "danger",
      "accent"
    ]
  },
  "nested": {}
}
```

### breadcrumb

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### button

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "tone": "string",
    "full": "boolean",
    "small": "boolean",
    "icon": "string",
    "action": "string"
  },
  "optional": {
    "span": "number",
    "tone": "string",
    "full": "boolean",
    "small": "boolean",
    "icon": "string",
    "action": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "tone": [
      "primary",
      "danger",
      "success",
      "ghost"
    ]
  },
  "nested": {}
}
```

### callout

```json
{
  "required": [
    "content"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "title": "string",
    "content": "string",
    "tone": "string"
  },
  "optional": {
    "span": "number",
    "title": "string",
    "tone": "string"
  },
  "aliases": {
    "kind": "tone",
    "text": "content",
    "body": "content",
    "desc": "content"
  },
  "valueAliases": {
    "tone": {
      "danger": "error",
      "warn": "warning"
    }
  },
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "tone": [
      "info",
      "success",
      "warning",
      "error"
    ]
  },
  "nested": {}
}
```

### card

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "title": "string",
    "items": "nodes",
    "tone": "string",
    "accent": "string"
  },
  "optional": {
    "span": "number",
    "title": "string",
    "tone": "string",
    "accent": "string"
  },
  "aliases": {
    "label": "title",
    "content": "items"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "tone": [
      "info",
      "success",
      "warning",
      "danger"
    ]
  },
  "nested": {}
}
```

### chart

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number",
    "kind": "string",
    "data": "array",
    "series": "array",
    "horizontal": "boolean",
    "stacked": "boolean",
    "filter": "string",
    "palette": "array"
  },
  "optional": {
    "span": "number",
    "kind": "string",
    "data": "array",
    "series": "array",
    "horizontal": "boolean",
    "stacked": "boolean",
    "filter": "string",
    "palette": "array"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [
    [
      "data",
      "series"
    ]
  ],
  "conditionalRequired": [
    {
      "kind": "required-if",
      "when": {
        "field": "kind",
        "equals": "donut"
      },
      "required": [
        "data"
      ]
    }
  ],
  "rules": [
    {
      "kind": "one-of-required",
      "fields": [
        "data",
        "series"
      ]
    },
    {
      "kind": "required-if",
      "when": {
        "field": "kind",
        "equals": "donut"
      },
      "required": [
        "data"
      ]
    }
  ],
  "enums": {
    "kind": [
      "bars",
      "line",
      "donut"
    ]
  },
  "nested": {
    "data": {
      "required": [
        "label",
        "value"
      ],
      "fields": {
        "label": "string",
        "value": "number",
        "color": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    },
    "series": {
      "required": [
        "label",
        "data"
      ],
      "fields": {
        "label": "string",
        "color": "string",
        "data": "array"
      },
      "enums": {},
      "nested": {
        "data": {
          "required": [
            "label",
            "value"
          ],
          "fields": {
            "label": "string",
            "value": "number",
            "color": "string"
          },
          "enums": {},
          "nested": {},
          "aliases": {}
        }
      },
      "aliases": {}
    }
  },
  "validator": {
    "name": "chart-renderability"
  }
}
```

### checkbox

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "checked": "boolean",
    "action": "string",
    "group": "string"
  },
  "optional": {
    "span": "number",
    "checked": "boolean",
    "action": "string",
    "group": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### code

```json
{
  "required": [
    "code"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "lang": "string",
    "code": "string"
  },
  "optional": {
    "span": "number",
    "lang": "string"
  },
  "aliases": {
    "content": "code",
    "text": "code"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### col

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "nodes",
    "gap": "number"
  },
  "optional": {
    "span": "number",
    "gap": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### copy

```json
{
  "required": [
    "text"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "text": "string"
  },
  "optional": {
    "span": "number",
    "label": "string"
  },
  "aliases": {
    "content": "text",
    "code": "text",
    "value": "text"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### diagram

```json
{
  "required": [
    "kind",
    "nodes"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "kind": "string",
    "variant": "string",
    "title": "string",
    "nodes": "array",
    "edges": "array",
    "zones": "array",
    "theme": "object"
  },
  "optional": {
    "span": "number",
    "variant": "string",
    "title": "string",
    "edges": "array",
    "zones": "array",
    "theme": "object"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "kind": [
      "architecture",
      "it-state",
      "flowchart",
      "sequence",
      "state",
      "er",
      "timeline",
      "swimlane",
      "quadrant",
      "radar",
      "loop",
      "nested",
      "tree",
      "org-chart",
      "layers",
      "venn",
      "pyramid",
      "bar",
      "line",
      "gantt",
      "scatter",
      "high-level",
      "process",
      "medallion",
      "data-flow",
      "dp-integration",
      "dp-security-matrix"
    ],
    "variant": [
      "light",
      "dark",
      "editorial"
    ]
  },
  "nested": {
    "nodes": {
      "required": [
        "id",
        "label"
      ],
      "fields": {
        "id": "string",
        "label": "string",
        "sub": "string",
        "type": "string",
        "x": "number",
        "y": "number",
        "w": "number",
        "h": "number",
        "tag": "string"
      },
      "enums": {
        "type": [
          "focal",
          "backend",
          "store",
          "external",
          "input",
          "optional",
          "security"
        ]
      },
      "nested": {},
      "aliases": {}
    },
    "edges": {
      "required": [
        "from",
        "to"
      ],
      "fields": {
        "from": "string",
        "to": "string",
        "label": "string",
        "kind": "string",
        "route": "string"
      },
      "enums": {
        "kind": [
          "solid",
          "dashed",
          "accent",
          "link"
        ],
        "route": [
          "auto",
          "orthogonal",
          "straight"
        ]
      },
      "nested": {},
      "aliases": {}
    },
    "zones": {
      "required": [
        "label"
      ],
      "fields": {
        "label": "string",
        "x": "number",
        "y": "number",
        "w": "number",
        "h": "number"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    },
    "theme": {
      "required": [],
      "fields": {
        "paper": "string",
        "paper-2": "string",
        "ink": "string",
        "muted": "string",
        "soft": "string",
        "rule": "string",
        "accent": "string",
        "accent-tint": "string",
        "link": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### diff

```json
{
  "required": [
    "diffs"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "diffs": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {
    "items": "diffs",
    "files": "diffs"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "diffs": {
      "required": [
        "path",
        "newText"
      ],
      "fields": {
        "path": "string",
        "oldText": "string-or-null",
        "newText": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### divider

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### echart

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number",
    "title": "string",
    "height": "number",
    "preset": "string",
    "data": "array",
    "series": "array",
    "links": "array",
    "palette": "array",
    "option": "object"
  },
  "optional": {
    "span": "number",
    "title": "string",
    "height": "number",
    "preset": "string",
    "data": "array",
    "series": "array",
    "links": "array",
    "palette": "array",
    "option": "object"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [
    [
      "option",
      "data",
      "series",
      "links"
    ]
  ],
  "conditionalRequired": [],
  "rules": [
    {
      "kind": "one-of-required",
      "fields": [
        "option",
        "data",
        "series",
        "links"
      ]
    }
  ],
  "enums": {
    "preset": [
      "bar",
      "line",
      "area",
      "pie",
      "scatter",
      "radar",
      "gauge",
      "funnel",
      "treemap",
      "sankey",
      "graph",
      "heatmap",
      "bigline",
      "wordCloud"
    ]
  },
  "nested": {}
}
```

### file-tree

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {
    "nodes": "items"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "items": {
      "required": [
        "name"
      ],
      "fields": {
        "name": "string",
        "type": "string",
        "children": "array"
      },
      "enums": {
        "type": [
          "file",
          "dir"
        ]
      },
      "nested": {
        "children": {
          "required": [
            "name"
          ],
          "fields": {
            "name": "string",
            "type": "string",
            "children": "array"
          },
          "enums": {
            "type": [
              "file",
              "dir"
            ]
          },
          "nested": {
            "children": {
              "required": [
                "name"
              ],
              "fields": {
                "name": "string",
                "type": "string",
                "children": "array"
              },
              "enums": {
                "type": [
                  "file",
                  "dir"
                ]
              },
              "nested": {
                "children": {
                  "required": [
                    "name"
                  ],
                  "fields": {
                    "name": "string",
                    "type": "string",
                    "children": "array"
                  },
                  "enums": {
                    "type": [
                      "file",
                      "dir"
                    ]
                  },
                  "nested": {
                    "children": {
                      "required": [
                        "name"
                      ],
                      "fields": {
                        "name": "string",
                        "type": "string",
                        "children": "array"
                      },
                      "enums": {
                        "type": [
                          "file",
                          "dir"
                        ]
                      },
                      "nested": {
                        "children": {
                          "required": [
                            "name"
                          ],
                          "fields": {
                            "name": "string",
                            "type": "string",
                            "children": "array"
                          },
                          "enums": {
                            "type": [
                              "file",
                              "dir"
                            ]
                          },
                          "nested": {
                            "children": {
                              "required": [
                                "name"
                              ],
                              "fields": {
                                "name": "string",
                                "type": "string",
                                "children": "array"
                              },
                              "enums": {
                                "type": [
                                  "file",
                                  "dir"
                                ]
                              },
                              "nested": {},
                              "aliases": {
                                "label": "name"
                              }
                            }
                          },
                          "aliases": {
                            "label": "name"
                          }
                        }
                      },
                      "aliases": {
                        "label": "name"
                      }
                    }
                  },
                  "aliases": {
                    "label": "name"
                  }
                }
              },
              "aliases": {
                "label": "name"
              }
            }
          },
          "aliases": {
            "label": "name"
          }
        }
      },
      "aliases": {
        "label": "name"
      }
    }
  }
}
```

### grid

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "cols": "number",
    "items": "nodes"
  },
  "optional": {
    "span": "number",
    "cols": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### image

```json
{
  "required": [
    "src"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "src": "string",
    "alt": "string"
  },
  "optional": {
    "span": "number",
    "alt": "string"
  },
  "aliases": {
    "url": "src",
    "link": "src"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### input

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "placeholder": "string",
    "value": "string",
    "inputType": "string",
    "action": "string",
    "id": "string"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "placeholder": "string",
    "value": "string",
    "inputType": "string",
    "action": "string",
    "id": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "inputType": [
      "text",
      "email",
      "password",
      "color"
    ]
  },
  "nested": {}
}
```

### json

```json
{
  "required": [
    "value"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "value": "unknown"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### keyvalue

```json
{
  "required": [
    "pairs"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "pairs": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {
    "items": "pairs",
    "rows": "pairs",
    "entries": "pairs"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "pairs": {
      "required": [
        "key",
        "value"
      ],
      "fields": {
        "key": "string",
        "value": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {
        "label": "key"
      }
    }
  }
}
```

### link

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "href": "string"
  },
  "optional": {
    "span": "number",
    "href": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### list

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "array",
    "filter": "string"
  },
  "optional": {
    "span": "number",
    "filter": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### mermaid

```json
{
  "required": [
    "code"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "code": "string"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### svg

```json
{
  "required": [
    "code"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "code": "string",
    "title": "string",
    "height": "number"
  },
  "optional": {
    "span": "number",
    "title": "string",
    "height": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### plot

```json
{
  "required": [
    "series"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "series": "array",
    "xMin": "number",
    "xMax": "number",
    "yMin": "number",
    "yMax": "number",
    "title": "string"
  },
  "optional": {
    "span": "number",
    "xMin": "number",
    "xMax": "number",
    "yMin": "number",
    "yMax": "number",
    "title": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "series": {
      "required": [
        "expr"
      ],
      "fields": {
        "expr": "string",
        "label": "string",
        "color": "string",
        "kind": "string",
        "params": "array"
      },
      "enums": {
        "kind": [
          "line",
          "area",
          "scatter"
        ]
      },
      "nested": {
        "params": {
          "required": [
            "name",
            "value"
          ],
          "fields": {
            "name": "string",
            "value": "number",
            "min": "number",
            "max": "number",
            "step": "number",
            "animateTo": "number",
            "durationMs": "number",
            "loop": "boolean"
          },
          "enums": {},
          "nested": {},
          "aliases": {}
        }
      },
      "aliases": {}
    }
  }
}
```

### progress

```json
{
  "required": [
    "value"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "value": "number",
    "label": "string",
    "valueLabel": "string",
    "variant": "string",
    "target": "number"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "valueLabel": "string",
    "variant": "string",
    "target": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "variant": [
      "bar",
      "ring"
    ]
  },
  "nested": {}
}
```

### quiz

```json
{
  "required": [
    "question",
    "options"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "question": "string",
    "options": "array",
    "explanation": "string",
    "id": "string",
    "action": "string"
  },
  "optional": {
    "span": "number",
    "explanation": "string",
    "id": "string",
    "action": "string"
  },
  "aliases": {
    "title": "question",
    "text": "question",
    "choices": "options",
    "items": "options"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### radio

```json
{
  "required": [
    "options"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "options": "array",
    "selected": "number",
    "action": "string",
    "group": "string",
    "answer": "unknown",
    "explanation": "string"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "selected": "number",
    "action": "string",
    "group": "string",
    "answer": "unknown",
    "explanation": "string"
  },
  "aliases": {
    "items": "options"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### row

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "nodes",
    "wrap": "boolean",
    "spacer": "boolean"
  },
  "optional": {
    "span": "number",
    "wrap": "boolean",
    "spacer": "boolean"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### scene3d

```json
{
  "required": [
    "meshes"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "title": "string",
    "meshes": "array",
    "ambient": "number",
    "background": "string"
  },
  "optional": {
    "span": "number",
    "title": "string",
    "ambient": "number",
    "background": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "meshes": {
      "required": [
        "shape"
      ],
      "fields": {
        "shape": "string",
        "color": "string",
        "position": "array",
        "rotation": "array",
        "scale": "unknown",
        "size": "unknown"
      },
      "enums": {
        "shape": [
          "box",
          "sphere",
          "cone",
          "cylinder",
          "torus"
        ]
      },
      "nested": {},
      "aliases": {}
    }
  }
}
```

### select

```json
{
  "required": [
    "options"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "options": "array",
    "action": "string",
    "selected": "number",
    "id": "string"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "action": "string",
    "selected": "number",
    "id": "string"
  },
  "aliases": {
    "items": "options"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### slider

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "min": "number",
    "max": "number",
    "step": "number",
    "value": "number",
    "action": "string",
    "id": "string"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "min": "number",
    "max": "number",
    "step": "number",
    "value": "number",
    "action": "string",
    "id": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### spacer

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### hero

```json
{
  "required": [
    "title"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "title": "string",
    "subtitle": "string",
    "value": "string",
    "label": "string",
    "delta": "string",
    "spark": "array",
    "tone": "string"
  },
  "optional": {
    "span": "number",
    "subtitle": "string",
    "value": "string",
    "label": "string",
    "delta": "string",
    "spark": "array",
    "tone": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "tone": [
      "accent",
      "success",
      "warning",
      "danger"
    ]
  },
  "nested": {}
}
```

### stat

```json
{
  "required": [
    "label",
    "value"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "value": "string",
    "delta": "string",
    "spark": "array",
    "size": "string"
  },
  "optional": {
    "span": "number",
    "delta": "string",
    "spark": "array",
    "size": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "size": [
      "hero"
    ]
  },
  "nested": {}
}
```

### steps

```json
{
  "required": [
    "steps"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "steps": "array",
    "current": "number"
  },
  "optional": {
    "span": "number",
    "current": "number"
  },
  "aliases": {
    "items": "steps"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "steps": {
      "required": [
        "title"
      ],
      "fields": {
        "title": "string",
        "desc": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### submit

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "action": "string",
    "resetAction": "string",
    "groups": "array"
  },
  "optional": {
    "span": "number",
    "action": "string",
    "resetAction": "string",
    "groups": "array"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### switch

```json
{
  "required": [
    "label"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "checked": "boolean",
    "action": "string"
  },
  "optional": {
    "span": "number",
    "checked": "boolean",
    "action": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### table

```json
{
  "required": [
    "columns",
    "rows"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "columns": "array",
    "rows": "array",
    "types": "array",
    "total": "boolean",
    "details": "array",
    "filter": "string",
    "filterColumn": "number",
    "sortField": "string",
    "export": "boolean"
  },
  "optional": {
    "span": "number",
    "types": "array",
    "total": "boolean",
    "details": "array",
    "filter": "string",
    "filterColumn": "number",
    "sortField": "string",
    "export": "boolean"
  },
  "aliases": {
    "headers": "columns",
    "data": "rows",
    "items": "rows"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### tabs

```json
{
  "required": [
    "tabs"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "tabs": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "tabs": {
      "required": [
        "label",
        "items"
      ],
      "fields": {
        "label": "string",
        "items": "nodes",
        "content": "nodes"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### text

```json
{
  "required": [
    "content"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "content": "string",
    "size": "string",
    "center": "boolean"
  },
  "optional": {
    "span": "number",
    "size": "string",
    "center": "boolean"
  },
  "aliases": {
    "text": "content"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "size": [
      "h1",
      "h2",
      "h3",
      "body",
      "muted",
      "caption"
    ]
  },
  "nested": {}
}
```

### textarea

```json
{
  "required": [],
  "fields": {
    "type": "string",
    "span": "number",
    "label": "string",
    "placeholder": "string",
    "rows": "number",
    "value": "string",
    "action": "string",
    "id": "string"
  },
  "optional": {
    "span": "number",
    "label": "string",
    "placeholder": "string",
    "rows": "number",
    "value": "string",
    "action": "string",
    "id": "string"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {}
}
```

### timeline

```json
{
  "required": [
    "items"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "items": "array"
  },
  "optional": {
    "span": "number"
  },
  "aliases": {},
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {},
  "nested": {
    "items": {
      "required": [
        "title"
      ],
      "fields": {
        "title": "string",
        "desc": "string",
        "time": "string"
      },
      "enums": {},
      "nested": {},
      "aliases": {}
    }
  }
}
```

### video

```json
{
  "required": [
    "src"
  ],
  "fields": {
    "type": "string",
    "span": "number",
    "src": "string",
    "alt": "string",
    "poster": "string",
    "loop": "boolean",
    "muted": "boolean",
    "aspectRatio": "string"
  },
  "optional": {
    "span": "number",
    "alt": "string",
    "poster": "string",
    "loop": "boolean",
    "muted": "boolean",
    "aspectRatio": "string"
  },
  "aliases": {
    "url": "src",
    "link": "src"
  },
  "valueAliases": {},
  "oneOfRequired": [],
  "conditionalRequired": [],
  "rules": [],
  "enums": {
    "aspectRatio": [
      "16:9",
      "4:3",
      "1:1",
      "9:16"
    ]
  },
  "nested": {}
}
```
