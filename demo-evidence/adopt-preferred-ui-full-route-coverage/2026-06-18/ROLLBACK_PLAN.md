# Rollback Plan

Generated: 2026-06-18T00:16:15.142Z

## Current Branch

`adopt/preferred-ui-structure-full-route-coverage`

## To Leave This Experiment

`git switch experiment/styleseed-clinicflow-heavy-reconstruction`

## To Remove This Experiment Branch Later

`git branch -D adopt/preferred-ui-structure-full-route-coverage`

## To Discard Uncommitted Experiment Changes In This Branch

Only after explicitly deciding to discard the experiment, use a non-destructive patch backup first:

`git diff > /tmp/clinicflow-preferred-ui-adoption.patch`

Then restore only reviewed paths manually or with explicit file-level restore commands. Do not use `git reset --hard` or `git clean` under the current safety policy.

## Cherry-pick Candidates If Partial Keep

- Shared shell/navigation/token coherence files.
- Small public/supervisor copy fixes.
- Route inventory and guard/documentation updates.
- Exclude generated raw screenshots unless they are needed for local evidence review.
