import nock from 'nock'
import { SlashAssignToolkit } from '../../src'
import commentHandler from '../../src/lib/comment-handler'
import { generateToolkit, recordNockRequests } from '../helpers'

describe('comment-handler', () => {
  let tools: SlashAssignToolkit

  beforeEach(() => {
    nock.cleanAll()
    tools = generateToolkit()
  })

  afterEach(() => {
    delete process.env.INPUT_REQUIRED_LABEL
  })

  it('assigns the user to the issue', async () => {
    const { scopedNock, requests } = recordNockRequests([
      {
        uri: '/repos/JasonEtco/testing/issues/1/assignees',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/labels',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/comments',
        method: 'post',
        response: { status: 200 }
      }
    ])

    await commentHandler(tools)
    expect(scopedNock.isDone()).toBe(true)
    expect(tools.exit.failure).not.toHaveBeenCalled()

    const [
      assignRequest,
      labelRequest,
      commentRequest
    ] = requests

    expect(assignRequest.params.assignees).toEqual([tools.context.payload.comment.user.login])
    expect(labelRequest.params.labels).toEqual(['slash-assigned'])
    expect(commentRequest.params.body).toMatchSnapshot()
  })

  it('exits early if the issue is already assigned', async () => {
    tools.context.payload.issue!.assignee = 'Saladin'
    await commentHandler(tools)
    expect(tools.exit.failure).toHaveBeenCalled()
    expect(tools.exit.failure).toHaveBeenCalledWith('Issue #1 is already assigned to @Saladin')
    delete tools.context.payload.issue?.assignee
  })

  it('exits early if required_label is set but not present', async () => {
    process.env.INPUT_REQUIRED_LABEL = 'required'
    await commentHandler(tools)
    expect(tools.exit.failure).toHaveBeenCalled()
    expect(tools.exit.failure).toHaveBeenCalledWith('Required label [required] label not found in issue #1.')
  })

  it('assigns the user if required_label is set and present', async () => {
    process.env.INPUT_REQUIRED_LABEL = 'required'
    tools.context.payload.issue!.labels = [{ name: 'required' }]

    const { scopedNock } = recordNockRequests([
      {
        uri: '/repos/JasonEtco/testing/issues/1/assignees',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/labels',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/comments',
        method: 'post',
        response: { status: 200 }
      }
    ])

    await commentHandler(tools)
    expect(tools.exit.failure).not.toHaveBeenCalled()
    expect(scopedNock.isDone()).toBe(true)
    tools.context.payload.issue!.labels = []
  })

  it('uses a custom assigned_comment message', async () => {
    process.env.INPUT_ASSIGNED_COMMENT = 'Assigned to @{{ comment.user.login }}'

    const { scopedNock, requests } = recordNockRequests([
      {
        uri: '/repos/JasonEtco/testing/issues/1/assignees',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/labels',
        method: 'post',
        response: { status: 200 }
      }, {
        uri: '/repos/JasonEtco/testing/issues/1/comments',
        method: 'post',
        response: { status: 200 }
      }
    ])

    await commentHandler(tools)
    expect(tools.exit.failure).not.toHaveBeenCalled()
    expect(scopedNock.isDone()).toBe(true)
    expect(requests[2].params.body).toBe('Assigned to @Shaxx')
  })
})
