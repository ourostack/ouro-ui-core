## main

Runs 10, success 5. Calls 60; errors 4, of which the next call recovered 1. Wrong turns 12; on a surface the main X-ray flagged: 0. Calls on flagged surfaces: 0.


Wrong turns a claim names: v0.1 0 of 12; v0.2 7 of 12.

| Run | Wrong turn | v0.1 claim | v0.2 claim |
|---|---|---|---|
| T2/1 | repeated: `m365tandem draft show Sam Example --json` | none | none |
| T2/2 | repeated: `m365tandem draft show ej90am --json` | none | none |
| T3/1 | denied by tool permissions: `printf '%s' 'The new banner is final.' \| m365tandem send '19:00000000aaaa0000aaaa000000000` | none | cli.text-as-argument |
| T3/2 | denied by tool permissions: `printf '%s' 'The new banner is final.' \| m365tandem send '19:00000000aaaa0000aaaa000000000` | none | cli.text-as-argument |
| T4/1 | denied by tool permissions: `printf '%s' 'Thanks, both. Can we ship & review on Thursday?' \| m365tandem edit-sent nxrlt` | none | cli.text-as-argument |
| T4/2 | repeated: `m365tandem edit-sent --help` | none | none |
| T4/2 | repeated: `m365tandem look --help` | none | none |
| T4/2 | denied by tool permissions: `m365tandem conversations --json \| jq '.[] \| select(.title \| test("Launch planning"; "i"))'` | none | none |
| T4/2 | denied by tool permissions: `printf '%s' 'Thanks, both. Can we ship & review on Thursday?' \| m365tandem edit-sent nxrlt` | none | cli.text-as-argument |
| T5/2 | exit 2: `m365tandem watch r82dfi --timeout 8h --json` | none | cli.wait-on-refs |
| T5/2 | exit 2: `m365tandem watch conversation:r82dfi --timeout 8h --json` | none | cli.wait-on-refs |
| T5/2 | denied by tool permissions: `python -u - <<'PY'` | none | cli.wait-on-refs |

## xray-v1

Runs 10, success 5. Calls 55; errors 5, of which the next call recovered 1. Wrong turns 7; on a surface the main X-ray flagged: 0. Calls on flagged surfaces: 0.


Wrong turns a claim names: v0.1 0 of 7; v0.2 3 of 7.

| Run | Wrong turn | v0.1 claim | v0.2 claim |
|---|---|---|---|
| T2/2 | repeated: `m365tandem draft show Sam Example --json` | none | none |
| T4/2 | repeated: `m365tandem edit-sent --help` | none | none |
| T5/1 | exit 2: `m365tandem watch r82dfi --timeout 8h --json` | none | cli.wait-on-refs |
| T5/1 | exit 2: `m365tandem watch chat:r82dfi --timeout 8h --json` | none | cli.wait-on-refs |
| T5/1 | exit 130: `m365tandem watch` | none | none |
| T5/2 | exit 2: `m365tandem watch chat:r82dfi --timeout 8h --json` | none | cli.wait-on-refs |
| T5/2 | exit 130: `m365tandem watch` | none | none |

## xray-v2

Runs 10, success 10. Calls 60; errors 1, of which the next call recovered 1. Wrong turns 3; on a surface the main X-ray flagged: 1. Calls on flagged surfaces: 5.

- others-see: 5
  - T3/1 exit 0: m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 Riley asked me to let you know: the new banner i
  - T3/2 exit 2: m365tandem send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley asked me to tell the L
  - T3/2 exit 0: m365tandem send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley asked me to tell the L
  - T4/1 exit 0: m365tandem edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --wh
  - T4/2 exit 0: m365tandem edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --wh

Wrong turns a claim names: v0.1 0 of 3; v0.2 0 of 3.

| Run | Wrong turn | v0.1 claim | v0.2 claim |
|---|---|---|---|
| T2/1 | repeated: `m365tandem draft show Sam Example --json` | none | none |
| T2/2 | repeated: `m365tandem draft show Sam Example --json` | none | none |
| T3/2 | exit 2: `m365tandem send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley as` | none | none |

