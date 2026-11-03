# The first adopter's selfcheck, before

Captured 2026-11-02 from the first adopter's main branch at `1599c10d`, run against its own test fixture: a real daemon over a throwaway store with made-up conversations, meetings and people, and a stand-in window that reports each write done (its `test/selfcheck.test.ts` fixture, with the made-up world seeded). Nothing reached a real service. Names are replaced as in the 2026-10-30 record: the command is `app`, the product is "the app" and the chat service is "the service". Short ids, times and the request id are the run's own.

## app selfcheck --dry-run

Exit 0, 80ms against the made-up daemon.

stdout:

```text
App self-check: 11 writes to the service. Its test messages go to your Notes to self, where only you see them.
Each goes the way your agent's do, logged as agent:self-check with the reason "self-check". The test messages are deleted at the end.

  will run Send a plain message (seen by only you)
  will run Send a formatted message (bold, italic, a list) (seen by only you)
  will run Send a message that @mentions you (seen by only you)
  will run Send a picture (a small made-up one) (seen by only you)
  will run Attach a file (a small made-up text file; it stays in your files folder) (seen by only you)
  will run Send a reply that quotes the plain message (seen by only you)
  will run React with a like (seen by only you)
  will run Remove the like (seen by only you)
  skipped  React with one of your organization's custom emoji, then take it off: your organization has no custom emoji in the app's catalog (or the window has not loaded them yet), so there is none to react with
  will run Edit a sent message (seen by only you)
  will run Mark the conversation read (seen by only you)
  will run Delete a sent message (seen by only you)
  will run Load older messages from the service (look --older; it only reads) (seen by nobody: it only reads)
  skipped  Reply in a channel thread, then delete the reply: everyone in the channel sees a reply, so it runs only in a thread you name. On your own thread in channel [u2ynm2] (you started it Sat, Oct 31 4:01 PM PDT): app selfcheck --reply-in u2ynm2#1793000000000 --yes
  skipped  Attach a file in a channel post (a small made-up text file; it stays in the channel's Files folder), then delete the post: everyone in the channel sees the post, and the file stays in its Files folder, so it runs only in a channel you name: --channel-file <channel> (app conversations lists them; a test channel is best)
  skipped  Mark an activity feed item seen: it changes your activity feed, not your Notes to self, so it runs only on an item you name. On activity item [z4vug0] (Mon, Nov 2 2:51 PM, unseen): app selfcheck --activity z4vug0
  skipped  Answer a meeting invite: the organizer gets the answer, so it runs only on a meeting you name. On meeting [cgl8c3] (Mon, Nov 2 5:01 PM), which you accepted; it sends the same answer again: app selfcheck --rsvp cgl8c3 --answer accept --yes
  skipped  Categorize a meeting, then take the category off: it changes your calendar, not your Notes to self, so it runs only on a meeting you name. On meeting [5le59j] (Mon, Nov 2 6:01 PM): app selfcheck --categorize 5le59j
  skipped  Start a new chat: skipped (it reaches another person). Check it by hand with a colleague: app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check" --dry-run (who would see it), then app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check"
To run the checks above on what the self-check found, in one go: app selfcheck --reply-in u2ynm2#1793000000000 --activity z4vug0 --rsvp cgl8c3 --answer accept --categorize 5le59j --yes

Sending to the service is on.
Nothing was sent (--dry-run). Run app selfcheck to do it.
```

stderr:

```text
(nothing)
```

## app selfcheck (every write passes)

Exit 0, 1369ms against the made-up daemon.

stdout:

```text
App self-check: 11 writes to the service. Its test messages go to your Notes to self, where only you see them.
Each goes the way your agent's do, logged as agent:self-check with the reason "self-check". The test messages are deleted at the end.

  passed   Send a plain message
  passed   Send a formatted message (bold, italic, a list)
  passed   Send a message that @mentions you
  passed   Send a picture (a small made-up one)
  passed   Attach a file (a small made-up text file; it stays in your files folder)
  passed   Send a reply that quotes the plain message
  passed   React with a like
  passed   Remove the like
  passed   Edit a sent message
  passed   Mark the conversation read
  passed   Delete a sent message
  passed   Load older messages from the service (look --older; it only reads)
  skipped  React with one of your organization's custom emoji, then take it off: your organization has no custom emoji in the app's catalog (or the window has not loaded them yet), so there is none to react with
  skipped  Reply in a channel thread, then delete the reply: everyone in the channel sees a reply, so it runs only in a thread you name. On your own thread in channel [u2ynm2] (you started it Sat, Oct 31 4:01 PM PDT): app selfcheck --reply-in u2ynm2#1793000000000 --yes
  skipped  Attach a file in a channel post (a small made-up text file; it stays in the channel's Files folder), then delete the post: everyone in the channel sees the post, and the file stays in its Files folder, so it runs only in a channel you name: --channel-file <channel> (app conversations lists them; a test channel is best)
  skipped  Mark an activity feed item seen: it changes your activity feed, not your Notes to self, so it runs only on an item you name. On activity item [z4vug0] (Mon, Nov 2 2:51 PM, unseen): app selfcheck --activity z4vug0
  skipped  Answer a meeting invite: the organizer gets the answer, so it runs only on a meeting you name. On meeting [cgl8c3] (Mon, Nov 2 5:01 PM), which you accepted; it sends the same answer again: app selfcheck --rsvp cgl8c3 --answer accept --yes
  skipped  Categorize a meeting, then take the category off: it changes your calendar, not your Notes to self, so it runs only on a meeting you name. On meeting [5le59j] (Mon, Nov 2 6:01 PM): app selfcheck --categorize 5le59j
  skipped  Start a new chat: skipped (it reaches another person). Check it by hand with a colleague: app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check" --dry-run (who would see it), then app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check"
To run the checks above on what the self-check found, in one go: app selfcheck --reply-in u2ynm2#1793000000000 --activity z4vug0 --rsvp cgl8c3 --answer accept --categorize 5le59j --yes

12 passed, 0 failed, 7 skipped.
Cleaned up: the test messages are deleted.
Every write that ran works. Nothing to send back.
```

stderr:

```text
(nothing)
```

## app selfcheck (one write fails)

Exit 1, 1197ms against the made-up daemon.

stdout:

```text
App self-check: 11 writes to the service. Its test messages go to your Notes to self, where only you see them.
Each goes the way your agent's do, logged as agent:self-check with the reason "self-check". The test messages are deleted at the end.

  passed   Send a plain message
  passed   Send a formatted message (bold, italic, a list)
  passed   Send a message that @mentions you
  passed   Send a picture (a small made-up one)
  passed   Attach a file (a small made-up text file; it stays in your files folder)
  passed   Send a reply that quotes the plain message
  FAILED   React with a like: not done (react to a message): the service refused the reaction (HTTP 400). Nobody saw anything. Request id: a6ca84af9b234.
  passed   Remove the like
  passed   Edit a sent message
  passed   Mark the conversation read
  passed   Delete a sent message
  passed   Load older messages from the service (look --older; it only reads)
  skipped  React with one of your organization's custom emoji, then take it off: your organization has no custom emoji in the app's catalog (or the window has not loaded them yet), so there is none to react with
  skipped  Reply in a channel thread, then delete the reply: everyone in the channel sees a reply, so it runs only in a thread you name. On your own thread in channel [u2ynm2] (you started it Sat, Oct 31 4:01 PM PDT): app selfcheck --reply-in u2ynm2#1793000000000 --yes
  skipped  Attach a file in a channel post (a small made-up text file; it stays in the channel's Files folder), then delete the post: everyone in the channel sees the post, and the file stays in its Files folder, so it runs only in a channel you name: --channel-file <channel> (app conversations lists them; a test channel is best)
  skipped  Mark an activity feed item seen: it changes your activity feed, not your Notes to self, so it runs only on an item you name. On activity item [z4vug0] (Mon, Nov 2 2:51 PM, unseen): app selfcheck --activity z4vug0
  skipped  Answer a meeting invite: the organizer gets the answer, so it runs only on a meeting you name. On meeting [cgl8c3] (Mon, Nov 2 5:01 PM), which you accepted; it sends the same answer again: app selfcheck --rsvp cgl8c3 --answer accept --yes
  skipped  Categorize a meeting, then take the category off: it changes your calendar, not your Notes to self, so it runs only on a meeting you name. On meeting [5le59j] (Mon, Nov 2 6:01 PM): app selfcheck --categorize 5le59j
  skipped  Start a new chat: skipped (it reaches another person). Check it by hand with a colleague: app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check" --dry-run (who would see it), then app chat new "<colleague>" --text "Hi" --agent self-check --why "self-check"
To run the checks above on what the self-check found, in one go: app selfcheck --reply-in u2ynm2#1793000000000 --activity z4vug0 --rsvp cgl8c3 --answer accept --categorize 5le59j --yes

11 passed, 1 failed, 7 skipped.
Cleaned up: the test messages are deleted.

Something failed. Paste this to your agent (it has no message text and no sign-in tokens):

App self-check, 2026-11-02 23:01 UTC (the app from a checkout, macOS): 11 passed, 1 failed, 7 skipped.
- react (reaction.add) failed: not done (react to a message): the service refused the reaction (HTTP 400). Nobody saw anything. Request id: a6ca84af9b234.
```

stderr:

```text
(nothing)
```

## app selfcheck (sending is off)

Exit 2, 4ms against the made-up daemon.

stdout:

```text
(nothing)
```

stderr:

```text
app: sending to the service is off, so the self-check sent nothing. To turn it on, run npm run writes -- on in the app folder; then run app selfcheck again. The self-check never turns it on itself.
```
