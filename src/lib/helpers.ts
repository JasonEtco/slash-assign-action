import { SlashAssignToolkit } from "..";

// Have to explicitly get these, because `tools.inputs` is a Proxy`
export function getInputsFromTools (tools: SlashAssignToolkit) {
  return {
    assigned_label: tools.inputs.assigned_label,
    required_label: tools.inputs.required_label,
    pin_label: tools.inputs.pin_label,
    days_until_warning: tools.inputs.days_until_warning,
    days_until_unassign: tools.inputs.days_until_unassign,
    stale_assignment_label: tools.inputs.stale_assignment_label,
    assigned_comment: tools.inputs.assigned_comment,
  }
}