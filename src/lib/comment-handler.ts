import dedent from 'dedent'
import { SlashAssignToolkit } from '.'

export default function commentHandler (tools: SlashAssignToolkit) {
  tools.command('assign', async () => {
    const { issue, comment } = tools.context.payload.issue
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
    if (issue.assignees.length !== 0) {
      tools.exit.failure(
        `${issue.number} already has ${issue.assignees.length} assignees.`
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

    // Comment saying wassup
    await tools.github.issues.createComment({
      ...tools.context.issue,
      body: dedent`
        This issue [has been assigned](${comment.html_url}) to ${comment.user.login}!

        It will become unassigned if it isn't closed within ${tools.inputs.assignment_length}. A maintainer can also add the **${tools.inputs.pin_label}** to prevent it from being unassigned.
      `
    })
  })
}