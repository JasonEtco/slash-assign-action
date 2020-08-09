import { Toolkit } from 'actions-toolkit'
import slashAssignAction from './lib'

Toolkit.run(slashAssignAction, {
  event: ['issue_comment.created', 'schedule']
})
