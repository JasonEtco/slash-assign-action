import { SlashAssignToolkit } from '../';
import StaleAssignments from './issue-processor'

export default async function scheduleHandler (tools: SlashAssignToolkit) {
  const processor = new StaleAssignments(tools)
  // Find all open issues with the assigned_label
  const issues = await processor.getStaleAssignments()

  tools.log.info(`Processing ${issues.length} stale assignments:`)

  for (const issue of issues) {
    // Ensure that the issue is assigned to someone
    if (!issue.assignee) continue
    // Check for the warning message
    const hasWarning = processor.hasWarningLabel(issue)
    if (!hasWarning) {
      // Post warning
      tools.log.info(`-- Warning @${issue.assignee.login} in #${issue.number}`)
      await processor.postWarningMessage(issue)
    } else {
      // Unassign the user
      tools.log.info(`-- Unassigning @${issue.assignee.login} from #${issue.number}`)
      await processor.unassignIssue(issue)
    }

    tools.log.info(`-- Done processing issue #${issue.number}`)
  }
}
