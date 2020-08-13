import dedent from 'dedent'
import { SlashAssignToolkit } from '.'
import { Issue } from './issue-processor'

export default function commentHandler (tools: SlashAssignToolkit) {
  tools.command('assign', async () => {
    const issue = tools.context.payload.issue as Issue
    const comment = tools.context.payload.comment

    // Check if the issue has the configured label
    if (tools.inputs.required_label) {
      const hasLabel = issue.labels.some(
        (label: { name: string }) => label.name === tools.inputs.required_label
      )

      if (!hasLabel) {
        tools.exit.neutral(
          `[${tools.inputs.required_label}] label not found in issue ${issue.number}.`
        )
      }
    }

    // Check if it has no assignees
    if (!issue.assignee) {
      tools.exit.failure(
        `${issue.number} is already assigned to ${issue.assignee}`
      )
    }

    // Assign the user
    await tools.github.issues.addAssignees({
      ...tools.context.issue,
      assignees: [comment.user.login]
    })

    // Label the issue
    await tools.github.issues.addLabels({
      ...tools.context.issue,
      labels: [tools.inputs.mark_label]
    })

    const days = parseInt(tools.inputs.days_until_unassign, 10)
    // Comment saying wassup
    await tools.github.issues.createComment({
      ...tools.context.issue,
      body: dedent`
        This issue [has been assigned](${comment.html_url}) to ${comment.user.login}!

        It will become unassigned if it isn't closed within ${days} days. A maintainer can also add the **${tools.inputs.pin_label}** to prevent it from being unassigned.
      `
    })
  })
}