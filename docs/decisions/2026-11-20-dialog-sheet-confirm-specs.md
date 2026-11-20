# Decision: Dialog, Sheet and ConfirmDialog are specs in core, one file each, before any kit builds them

Status: accepted, 2026-11-20, for ourostack/ouro-ui#2297 (Windows and Android have only 8 components), wave 1.

## Why

Web has Dialog, Sheet and ConfirmDialog; Windows and Android have none, and core has no spec for them. A kit that builds one without a spec invents its own names and focus rules, and the cross-kit grid cannot compare them.

## Decision

- `dialog`, `sheet` and `confirm-dialog` each get a spec in `standard/hx/components/`, one file per component, so lanes adding components do not edit the same file.
- The three join the claims they share with `alert` and `sheet` (touch target, reduced motion, spoken name, text reflow, contrast; dismiss reachable for Dialog and Sheet). ConfirmDialog has no dismiss claim: an outside press never closes it, and Cancel and Escape do.
- No `dialog` role exists in a case's `agent.role`, so each case uses `group`, and each platform's accessibility text says the native role.
- ConfirmDialog's `action` property reads the description from `actionText(action).confirm`, so the dialog, the consent sheet and an agent's confirm prompt say the same words.
- The test that listed every spec file by name now checks the list is sorted and holds the three new names, so a lane adding a component adds its spec file and nothing else.

## Prior art

Read on 2026-11-20.

- [WinUI ContentDialog](https://learn.microsoft.com/en-us/windows/apps/design/controls/dialogs-and-flyouts/dialogs): adopt, the Windows form of Dialog and ConfirmDialog, Cancel as the default button.
- [Material 3 dialogs and bottom sheets](https://m3.material.io/components/dialogs/overview): adopt, the Android form.
- [WAI-ARIA dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): borrow, focus moves in, stays, returns; alertdialog for ConfirmDialog.
- [Apple Human Interface Guidelines: sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): watch, the Apple form, not built yet.
