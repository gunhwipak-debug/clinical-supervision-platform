# Rollback Plan

## Revert Only The Source Candidate
```bash
git switch ulw/overnight-commercial-readiness-master
git revert a187b3f
```

## Return To Previous Stable Branch
```bash
git switch ulw/drag-select-availability-calendar
```

## Delete The Experiment Branch After Decision
Local only:
```bash
git branch -D ulw/overnight-commercial-readiness-master
```

Remote branch, only after the user decides to discard it:
```bash
git push origin --delete ulw/overnight-commercial-readiness-master
```

## Production Safety
- No production deploy was performed.
- No production DB or migration path was touched.
- The candidate is isolated on an experiment branch.
