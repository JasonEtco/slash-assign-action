import { SlashAssignToolkit } from '.';
import StaleAssignments from './issue-processor'

export default async function scheduleHandler (tools: SlashAssignToolkit) {
  const processor = new StaleAssignments(tools)
  // Find all open issues with the mark_label
  const issues = await processor.getStaleAssignments('issues')

  for (const issue of issues) {
    // Check for the warning message
    const hasWarning = await processor.hasWarningLabel(issue)
    if (!hasWarning) {
      // Post warning
      await processor.postWarningMessage(issue)
    } else {
      // Unassign the user
      await processor.unassignIssue(issue)
    }
  }
}
