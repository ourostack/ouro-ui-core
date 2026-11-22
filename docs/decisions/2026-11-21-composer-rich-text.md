# Decision: Composer's rich-text mode is a mode of Composer, built on Lexical and loaded lazily

Status: accepted, 2026-11-21, for [ourostack/ouro-ui#2860](https://github.com/ourostack/ouro-ui/issues/2860). Web builds it first.

## Why

A chat app wants Composer to show bold, lists, quotes and code as you type, with no preview. Composer today is a text area that holds light markdown. The new mode has to keep what Composer does (mentions, emoji, attachments, IME, growing then scrolling) and cost nothing to an app that never turns it on.

## Decision

1. **A mode, not a new item.** `<Composer format="rich">`. Apps keep one component, one value shape (light markdown, plus mention and emoji tokens) and one send path. `format` defaults to plain.
2. **Lexical 0.x, loaded lazily.** The editor sits in Composer's `-parts` module behind a dynamic `import()`, started when a rich Composer mounts on the client. Until it loads, and on the server, Composer draws its plain text area with the same value, so SSR and hydration never touch `window`, and typing before the load is kept. Plain Composer's bundle and the site's size ceilings do not move.
3. **The value is light markdown.** Lexical's markdown transformers read and write it; mentions and emoji are one Lexical token each. HTML out is added only on request.
4. **Paste is an allowlist.** Bold, italic, underline, strikethrough, links, lists, quotes and code from HTML; everything else is plain text.
5. **Dependency.** Lexical's packages are added to the registry item's `dependencies` at caret ranges, so `shadcn add` installs them. This record is the dependency's record.

## What was measured

Four spikes, each the smallest editor with rich text, built with esbuild 0.x in production mode, minified, then gzipped at level 9 (React 19.3.1 and react-dom included in every spike, 69,155 bytes gzipped, subtracted below). Spikes ran on 2026-11-21 on macOS with Playwright 1.65.1.

| Candidate | Spike contents | Gzipped, net of React | IME in Chromium (CDP composition, "ni" to "你", "hao" to "好") |
| --- | --- | --- | --- |
| Plain contenteditable | one `contentEditable` div | 0 B (and nothing to read markdown, lists or undo) | text right, events start, 4 updates, end |
| Lexical 0.53.0 | core, rich-text, history, list, code, link, markdown shortcuts | 145,401 B | text right, same events |
| Tiptap 3.34.0 (ProseMirror) | StarterKit | 130,029 B | text right, same events |
| Slate 0.147.4 / slate-react 0.147.6 | core, React, history | 70,948 B, with no markdown, lists or shortcuts | text right, same events |

- **IME, Chromium:** all four kept `a你好b` after two compositions and fired `compositionstart`, four `compositionupdate`s and `compositionend` per composition.
- **IME, WebKit:** Playwright cannot drive a real input method in WebKit. A synthetic sequence (composition events plus `execCommand`) left plain contenteditable and Tiptap at `a你b`, and Lexical and Slate out of step with it. A synthetic run proves nothing either way, so **the build proves WebKit with the repository's own WebKit project and its custom commands, and a failure there reopens this record.**
- **Screen readers:** all four candidates are native contenteditable, so VoiceOver and NVDA announce typing and selection as they do in any text box; none adds a hidden mirror. What each announces when formatting changes is the build's job to prove in the screen-reader lane, and Composer keeps `role="textbox"` and `aria-multiline`.
- **React 19 and SSR:** Lexical's core has no React dependency, so Composer's own hook mounts it in an effect and the server renders the plain text area. `@lexical/react` was not used; the spike without it is the figure above.

## Why Lexical

It ships what the issue lists, as parts: markdown import and export, shortcuts as you type, lists, history, paste handling, and a token node for mentions and emoji. Tiptap is 15 kB smaller and also complete, and its StarterKit spike also had lists, history and typed-markdown rules. Neither spike had markdown export or a mention token; we judged Lexical's markdown package and node model the closer fit, and that judgement is unmeasured. Slate is half the size and leaves markdown, lists and shortcuts to us, the work most likely to be wrong around IME. Plain contenteditable is the work of every one of them plus undo and the composition cases. The 145 kB is paid only by a page that renders `format="rich"`, after first paint.

## Alternatives not taken

- **A new `RichComposer` item:** apps would swap components and two value shapes would drift.
- **Plain contenteditable and our own rules:** cheapest to ship, most expensive to keep correct under CJK input, dictation and Android keyboards.

## Checks in web

Each is a test that fails first: mentions and emoji as one token; an attachment survives a format change; IME composition in Chromium and WebKit leaves the text and does not send on the Enter that commits it; Enter sends and Shift+Enter starts a line; paste keeps the allowlist and drops the rest; the plain Composer's bundle does not grow.

## Prior art

Read on 2026-11-21.

| Find | Verdict | Why |
| --- | --- | --- |
| [Lexical](https://lexical.dev/) ([source](https://github.com/facebook/lexical)) | **Adopt** | The measured choice above: complete, framework-free core, markdown and token nodes included. |
| [Tiptap](https://tiptap.dev/) on [ProseMirror](https://prosemirror.net/) | **Watch** | Passed the IME spike and is smaller. Markdown export and the token node would be ours to add (unmeasured); revisit if Lexical's size or releases become a problem. |
| [Slate](https://docs.slatejs.org/) | **Ignore** | Smallest, but markdown, lists and shortcuts are ours to write. |
| Plain `contenteditable` | **Ignore** | Reimplements undo, composition and paste for every browser. |
| [React Aria's TextField](https://react-spectrum.adobe.com/react-aria/TextField.html) and [Base UI's Field](https://base-ui.com/react/components/field) | **Borrow** | Neither has rich text; Composer keeps their labelling, `aria-multiline` and focus behaviour. |
| [Lexical's markdown package](https://lexical.dev/docs/packages/lexical-markdown) | **Adopt** | Provides the typed-markdown shortcuts and the import and export the value uses. |
