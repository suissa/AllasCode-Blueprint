# `examples` branch protection

The `examples` branch is a release-governed branch. Its repository-level protection must require pull requests and the `semantic-ci` status check before merge.

The reproducible contract is stored in `governance/examples-branch-protection.json`.

## Required repository settings

- Branch: `examples`
- Require pull request before merge: enabled
- Required status check: `semantic-ci`
- Require branch to be up to date / strict status checks: enabled
- Pending required check blocks merge
- Failed required check blocks merge

The Semantic Merge Gate is executed inside `semantic-ci`. A semantic `BLOCK` must fail that workflow, which in turn must make GitHub reject the merge under normal permissions. An `ALLOW` result can merge only after the required check is green and any other repository rules are satisfied.

## Applying the rule

This repository configuration requires an owner/admin credential with branch-protection or ruleset write access. The current automation integration can validate and read repository state but does not have permission to create or update this rule.

After applying the rule, verify both cases on disposable PRs:

1. Create a PR whose Semantic Merge Gate intentionally returns `BLOCK`; confirm GitHub marks the PR unmergeable while `semantic-ci` fails.
2. Create an `ALLOW` PR; confirm merge becomes available only after `semantic-ci` completes successfully.

Issue #23 must remain open until those repository-level checks are demonstrated. The presence of this file alone is not evidence that protection is active.
