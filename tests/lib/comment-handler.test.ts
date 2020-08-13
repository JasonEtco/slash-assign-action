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

    const [
      assignRequest,
      labelRequest,
      commentRequest
    ] = requests

    expect(assignRequest.assignees).toEqual([tools.context.payload.comment.user.login])
    expect(labelRequest.labels).toEqual(['slash-assigned'])
  })
})
