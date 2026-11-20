# Decision: a focus ring shows for keyboard focus, and a press leaves a border tone on a text field

Status: accepted, 2026-11-20, on a request from an app's lane. Web shipped it in [ourostack/ouro-ui#2509](https://github.com/ourostack/ouro-ui/pull/2509).

## Why

Browsers draw `:focus-visible` on a text field after a click, so every Ouro field showed a ring on a press. An app hid it with its own script and one CSS rule. A ring that follows a press reads as noise; a ring that is missing when a key moves focus fails keyboard users.

## Decision

- Ouro tracks how focus last moved. Its existing `last-input` document listeners (capture phase, no layout reads) also set `data-ouro-modality="pointer|keyboard"` on the root element: `pointer` after a press, `keyboard` after a key, a lone modifier ignored. Focus a script moves after a key press therefore keeps the keyboard ring.
- Components keep drawing their ring with `:focus-visible` utilities. One unlayered rule in `ouro-base.css` removes the outline under `pointer`. Before any input, and in server HTML, the attribute is absent and the browser's own heuristics apply.
- A text field marks a pointer-focused state with its border in the ring colour (`ouro-field-cue`), so focus is never invisible. A borderless field (`variant="plain"`) keeps its ring.
- Field components import `last-input`, so a field used alone still tracks input. No app CSS, and no `OuroProvider`.
- Tests: pointer focus (ring off, border cue), keyboard focus, scripted focus after a key press, forced colours, and layout reads.

## Prior art

Read on 2026-11-20.

| Find | Verdict | Why |
| --- | --- | --- |
| [keyborg](https://github.com/microsoft/keyborg) | **Borrow** | Its idea: track the last input on the document and mark the root, so programmatic focus after a key keeps the ring. We reuse listeners Ouro already has instead of adding a dependency. |
| [React Aria useFocusVisible](https://react-spectrum.adobe.com/react-aria/useFocusVisible.html) | **Borrow** | A lone modifier does not switch modality, and a key press counts as keyboard. |
| [what-input](https://github.com/ten1seven/what-input) | **Ignore** | The same root-attribute idea with touch and mouse detail Ouro does not need, and a new dependency. |
| [CSS `:focus-visible` heuristics](https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo) | **Adopt** | Used as is for buttons and controls, and as the fallback before any input. They always match on text fields, which is the gap the attribute covers. |
