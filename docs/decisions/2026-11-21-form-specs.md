# Decision: Select, Switch and Field are specs in core, and TextField and Checkbox gain Android entries, before any kit builds them

Status: accepted, 2026-11-21, for ourostack/ouro-ui#2297 (Windows and Android have only 8 components), wave 4, forms.

## Why

Web has Select, Switch and Field; Windows and Android have none, and core has no spec for them. Core has TextField and Checkbox specs, but they name no Android type or semantics. A kit that builds a form control without a spec invents its own label, error and required wiring, and the cross-kit grid cannot compare them.

## Decision

- `select`, `switch` and `field` each get a spec in `standard/hx/components/`, one file per component.
- Select and Switch join all five shared claims: touch target, reduced motion, spoken name, text reflow and contrast. Field draws no control of its own, so it joins only spoken name, text reflow and contrast.
- `text-field` and `checkbox` move to 1.1.0: each gains an `accessibility.android` string and an Android platform entry. Their properties do not change.
- A case's `agent.role` has no switch or combobox value, so a Switch case uses `checkbox` (a toggle) and a Select case uses `button` (a button that opens a list). Each platform's accessibility text says the native role.
- Windows and Android open Select's list as a flyout or dropdown, not a bottom sheet, and list no multiple or option groups yet. Both are recorded as deviations.

## Prior art

Read on 2026-11-21.

- [WinUI ComboBox](https://learn.microsoft.com/en-us/windows/apps/design/controls/combo-box), [ToggleSwitch](https://learn.microsoft.com/en-us/windows/apps/design/controls/toggles) and [TextBox](https://learn.microsoft.com/en-us/windows/apps/design/controls/text-box): adopt, the Windows forms.
- [Material 3 exposed dropdown menu](https://m3.material.io/components/menus/overview), [switch](https://m3.material.io/components/switch/overview) and [text fields](https://m3.material.io/components/text-fields/overview): adopt, the Android forms.
- [WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) and [select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/): borrow, the keyboard and the spoken state.
- [WCAG 3.3.1 Error Identification](https://www.w3.org/TR/WCAG22/#error-identification) and [1.3.1 Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships): borrow, the label, error and required wiring Field spells out.
- [Apple Human Interface Guidelines: pickers](https://developer.apple.com/design/human-interface-guidelines/pickers): watch, the Apple form, not built yet.
