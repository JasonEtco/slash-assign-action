import nock from 'nock'
import { URL } from 'url'
import { SlashAssignToolkit } from '../../src'
import scheduleHandler from '../../src/lib/schedule-handler'
import { generateToolkit, recordNockRequests } from '../helpers'

describe('comment-handler', () => {
  let tools: SlashAssignToolkit

  beforeEach(() => {
    nock.cleanAll()
    tools = generateToolkit()
  })

  it('comments and labels stale assignments', async () => {
    const { scopedNock, requests } = recordNockRequests([
      {
        uri: /^\/search\/issues\?q=/,
        method: 'get',
        response: {
          status: 200,
          body: {
            items: [{
              number: 1,
              labels: []
            }]
          }
        }
      },
      {
        uri: '/repos/JasonEtco/testing/issues/1/comments',
        method: 'post',
        response: { status: 200 }
      },
      {
        uri: '/repos/JasonEtco/testing/issues/1/labels',
        method: 'post',
        response: { status: 200 }
      }
    ])

    await scheduleHandler(tools)
    expect(scopedNock.isDone()).toBe(true)

    const [
      searchRequest,
      commentRequest,
      labelRequest
    ] = requests

    const { searchParams } = new URL(`https://api.github.com/${searchRequest.uri}`)
    expect(searchParams.get('q'))
      .toMatch('label:"slash-assigned" -label:"pinned" is:issue repo:JasonEtco/testing assigned:* is:open updated:<')
    expect(commentRequest.params.body).toBe('@Shaxx, this issue hasn\'t had any activity in 14 days. It will become unassigned in 7 days to make room for someone else to contribute.')
    expect(labelRequest.params.labels).toEqual(['stale-assignment'])
  })
})