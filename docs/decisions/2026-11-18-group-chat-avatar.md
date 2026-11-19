# Decision: a group chat is drawn from its members, not as a channel

Follows [Rounder people, and presence as a dot on the curve](2026-11-14-rounder-people-presence-dot.md), which made a person rounder than a team so the two read apart.

## Why

Ari, on the Nautilus voyage's ship's radio: "i am also realizing we might be using the same way of visualizing group chats the same way we do channels, which is certainly not right". The radio's group chat, "The whole crew", showed `<Avatar shape="square">`, the tile Ouro HX keeps for a team, a channel, an app or a bot, with the initials "TC". Ouro HX had no way to draw a group chat. `AvatarGroup` is a row of overlapping faces (the cooks on a recipe), wider than one avatar, so it does not fit a conversation list's avatar slot.

A group chat and a channel are different things to the person reading the list. A group chat is a few people you talk to directly. A channel is a named place, such as a topic or a team. Chat apps draw them differently, so Ouro HX should too.

## Decision

1. **`members` on Avatar draws a group chat.** `<Avatar name="The whole crew" members={[{ name, src }, …]} />`. It is the prop an agent guesses for "who is in this chat", and it keeps one component for the picture of a conversation. Names agents also try (`participants`, `people`, `users`, `shape="group"`) are type errors and development messages that name `members`.
2. **The person's squircle, cut into slices.** The group keeps a person's rounder squircle and size. Inside it, its members' pictures sit side by side as slices, as Fluent UI's `pie` layout draws them:
   - below 40 px, the first two members, a half each;
   - from 40 px up, the first three: a half, then two quarters stacked on the end side;
   - one member fills the whole avatar.

   A gap separates the slices. It is a hole, not a line painted in the background's colour, so a photo or gradient behind the avatar shows through it, as with the presence dot's cut-out.
3. **Each slice is a member's picture, or their initial in their own hue.** A member looks the same in a group as on their own. A slice has room for one letter, so it shows one.
4. **A group can set its own picture.** `src` with `members` shows the group's own picture once it loads, and the slices until then or if it fails.
5. **A group has no presence and no shape.** A presence or `shape` passed with `members` draws nothing and warns with the fix.
6. **Screen readers hear who is in it.** "The whole crew, group chat with Captain Nemo, Professor Aronnax and 2 others": the first two members by name, then the rest as a count. `membersLabel` changes the words for other languages.
7. **ConversationList says which is which.** A person gets their `Avatar`, a group chat its `members` (an item takes `members` itself), and a team or a channel `shape="square"`. A row whose avatar is an `AvatarGroup` warns in development and names `members`.

## Prior art

Read on 2026-11-18.

| Find | Verdict | Why |
| --- | --- | --- |
| Fluent UI `AvatarGroup` with `layout="pie"` ([types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-avatar/library/src/components/AvatarGroup/AvatarGroup.types.ts), [spec](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-avatar/library/docs/SPEC-AvatarGroup.md), [styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-avatar/library/src/components/AvatarGroup/useAvatarGroupStyles.styles.ts)): two members cut in half side by side, or a half and two quarters; at most three inside; mirrored right to left | **Adopt** | The geometry. Ouro draws the gap as a hole rather than a stroke, and keeps the squircle instead of a circle. |
| Microsoft Teams: a group chat's default picture is "generated from the profile pictures of the participants (or their initials, if no pictures exist)" ([office365itpros.com](https://office365itpros.com/2024/04/12/group-chat-picture-teams/)); a group can set its own picture, emoji or illustration and go back to the default ([Microsoft Support](https://support.microsoft.com/en-gb/teams/chat/personalize-your-group-chat-image-in-microsoft-teams)); a team has a separate team picture ([Microsoft Support](https://support.microsoft.com/en-gb/teams/teams-channels/change-your-team-picture-in-microsoft-teams)) | **Adopt** | Members' pictures, initials when there are none, and the group's own picture over them. |
| Apple Messages: a group can have a name and a photo, emoji or Memoji ([Apple Support](https://support.apple.com/en-am/104977)) | **Borrow** | The group's own picture (`src`). |
| Stream Chat `GroupAvatar` ([source](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/GroupAvatar.tsx)): one member draws a single avatar; up to four in a grid, or two and a "+N" | **Borrow** | One member fills the avatar. **Ignore** the four-tile grid: at 24 and 32 px a quarter is too small to tell who it is. |
| Sendbird UIKit: a group channel's default cover "combines all profile images of the channel members" ([docs](https://sendbird.com/docs/chat/uikit/v3/ios-uikit/group-channel-views/create-group-channel)) | **Borrow** | Confirms the generated tile with a cover picture over it. |
| Google Messages: group icons generated from members' initials and pictures; reviewers found similar groups hard to tell apart, and a custom picture can't be undone ([Android Police](https://www.androidpolice.com/google-messages-custom-group-chat-icons/)) | **Borrow** | The lesson: let a group set its own picture, and keep the default to go back to (a group's `src` is just a prop). |
| WhatsApp: a silhouette on a colour tile until a group sets a photo; a beta uses a member's initial instead ([Android Police](https://www.androidpolice.com/whatsapp-testing-group-chat-user-avatar-icons/)) | **Borrow** | Initials over a silhouette. **Ignore** the silhouette, which says nothing about who is in the group. |
| Google Chat spaces: a space has an emoji avatar and is for a topic or project ([Google Chat Help](https://support.google.com/chat/answer/7659784?hl=en-AU)) | **Borrow** | A named place gets a named tile (Ouro's square), and people get a tile made from them. |
| Slack: a group direct message holds up to nine people and can become a private channel ([Slack Help](https://slack.com/help/articles/212281468-Understand-direct-messages)) | **Watch** | The sidebar's combined icon could not be confirmed from a primary source. |
| MUI `AvatarGroup` ([docs](https://mui.com/material-ui/react-avatar/)), Atlassian, Ant and Primer avatar stacks | **Ignore** | A stack is wider than one avatar; Ouro's `AvatarGroup` already covers it. |
| CometChat group item: one group icon with a type badge ([docs](https://www.cometchat.com/docs/ui-kit/angular/components/cometchat-group-item)) | **Ignore** | A named icon, not drawn from the members. |
| Presence on a group | **Ignore** | Only Stream offers an online flag for a group; a group has no single presence. |

## Where it lives

Web: `Avatar`'s `members` and `ConversationList`'s items in ourostack/ouro-ui. Apple, Windows and Android adopt the same drawing when their kits add a group chat.
