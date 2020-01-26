import CloudflareWorkerGlobalScope from 'types-cloudflare-worker'
declare var self: CloudflareWorkerGlobalScope

import { CloudflareLog } from './lib/types/CloudflareLog'
import processEvent from './lib/processEvent'
import { sentryLog } from './lib/utils/sentry'
import sleep from './lib/utils/sleep'
import simpleId from './lib/utils/simpleId'
import elastic from './lib/db/elastic'

export let workerStartedAt: Date
export const workerID = simpleId(10)

export let batchedLogs: CloudflareLog[] = []
export let batchScheduled               = false

const scheduleBatch = async () => {
  if (batchScheduled) {
    return
  }

  batchScheduled = true

  if (batchedLogs.length <= 100) {
    await sleep(Number(process.env.BATCH_INTERVAL) || 500)
  }

  if (batchedLogs.length === 0) {
    return
  }

  const sendingLogs = [...batchedLogs]
  batchedLogs = []

  const batchRes = await elastic.bulkIndex({
    index: process.env.ELASTIC_INDEX!,
    docs: sendingLogs
  })

  console.log(await batchRes.json())
  batchScheduled = false
  return
}

self.addEventListener('fetch', async event => {
  event.passThroughOnException()

  // Set the worker's start date if not present. 
  // Doing it here, as doing it outside the fetchEvent gives a invalid Date
  if (!workerStartedAt) {
    workerStartedAt = new Date()
  }

  const res = processEvent(event).catch(async (err) => {
    if (process.env.SENTRY_PROJECT_ID && process.env.SENTRY_KEY) {
      await sentryLog(err, event.request)

      throw err
    }
  })

  event.waitUntil(scheduleBatch())
  event.respondWith(res as Promise<Response>)
})
