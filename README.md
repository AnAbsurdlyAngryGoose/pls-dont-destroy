# Please, Don't Destroy

When a user deletes their own post, it disappears from the mobile moderation tools. For moderator teams that work mainly on mobile, this makes it difficult to see what was removed, why it was removed, or whether the user has a pattern of problematic behavior. As a result, effective, fair, and balanced moderation can become harder than it needs to be.

After configurable thresholds are met _Please, Don't Destroy_ can:

- Gently encourage users to "Please, Don't Destroy" their submissions
- Temporarily ban a user
- Permanently ban a user
- Silently filter a user's submissions

### This App is Open Source

The source code for this app is available on [GitHub](https://github.com/AnAbsurdlyAngryGoose/pls-dont-destroy).

## What's New?

The current version of _Please Don't Destroy_ is **0.3.0**, published 4th December 2025. This version introduces the following changes:

 - Creates a "Mod Notification" when a new version is available.
   - "Major Update", "New Feature", and "Bug Fix" options.
   - "Critical" patches are **always** notified.
 - Identifies banned/suspended users and removes associated data from the store.

For historical versions, see [RELEASES.md](https://github.com/AnAbsurdlyAngryGoose/pls-dont-destroy/blob/main/RELEASES.md).

## Installation

The application can be installed into a subreddit from the [App Directory](https://developers.reddit.com/apps/plsdontdestroy).

## Configuration

The application supports configuration of activity thresholds and message content. Sensible defaults are preconfigured as follows:

- The user is notified from the 2nd deletion.
- Temporary bans of 3 days are issued from the 3rd deletion.
- Silent filtering is enforced from the 5th deletion.
- Permanent bans are not issued.

## Compliance Statement

_Please, Don't Destroy_ is compliant with Reddit policy. See [COMPLIANCE.md](https://github.com/AnAbsurdlyAngryGoose/pls-dont-destroy/blob/main/COMPLIANCE.md).
