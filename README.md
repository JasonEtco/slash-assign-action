<h3 align="center">✋💪</h3>
<h3 align="center">[WIP] `/assign` action</h3>

<p align="center"><a href="https://github.com/JasonEtco/slash-assign-action"><img alt="GitHub Actions status" src="https://github.com/JasonEtco/slash-assign-action/workflows/CI/badge.svg"></a> <a href="https://codecov.io/gh/JasonEtco/slash-assign-action/"><img src="https://badgen.now.sh/codecov/c/github/JasonEtco/slash-assign-action" alt="Codecov"></a></p>

---

A GitHub Action that listens for a `/assign` "command" (an issue comment that starts with `/assign`).

## Usage

```yaml
name: Slash assign

on:
  issue_comment:
    types: [created]

jobs:
  if: ${{ github.event_name == issue_comment }} && ${{ startsWith(github.event.comment.body, "/assign") }}
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Assign the user
        uses: JasonEtco/slash-assign-action@v1
        with:
          required_label: good-first-issue
```

## TODO

- [x] Check for a configurable label before assigning the commenter
- [x] Check that the issue doesn't already have an assignee
- [x] Comment saying that the issue is now assigned
- [ ] On a schedule, un-assigned stale issues
- [ ] Unless the issue has the configured `pin_label`