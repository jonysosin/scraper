import { Lambda } from 'aws-sdk'
import axios from 'axios'
import bluebird from 'bluebird'
import argparse from 'argparse'

const lambda = new Lambda({
  region: 'us-west-2',
  maxRetries: 3,
  httpOptions: { timeout: 10 * 60 * 1000 },
})

const FUNCTION_NAME = 'FakeScraper'
const FUNCTION_VERSION = process.env.CIRCLE_SHA1!
const URL_DELAY = 2000 // delay between invocations of urls
const MAX_RETRY_COUNT = 3 // max retries per url
const MAX_FAILS = 10 // max fails before aborting

// branch is expected to be of the form <author>/providers/<provider1>+<provider2>...+<providern>
const providers = process.env.CIRCLE_BRANCH!.match(/.*\/providers\/([\w+]+)/)[1]!.split('+')

async function getUrlsForProvider(provider: string): Promise<string[]> {
  // TODO make some sort of orchestrator api request
  return []
}

function generatePayload(url: string, provider: string) {
  // mimic SQS payload
  return {
    Records: [
      {
        messageId: '19dd0b57-b21e-4ac1-bd88-01bbb068cb78',
        receiptHandle: 'MessageReceiptHandle',
        body: JSON.stringify({
          pageUrl: url,
          extractors: [provider],
          scheduleTime: new Date().toISOString(),
        }),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1523232000000',
          SenderId: '123456789012',
          ApproximateFirstReceiveTimestamp: '1523232000001',
        },
        messageAttributes: {},
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:MyQueue',
        awsRegion: 'us-west-2',
      },
    ],
  }
}

async function tryScrape(url: string, provider: string) {
  const payload = generatePayload(url, provider)
  return lambda
    .invoke({
      FunctionName: FUNCTION_NAME,
      Qualifier: FUNCTION_VERSION,
      Payload: JSON.stringify(payload),
    })
    .promise()
}

async function getFailure(lambdaResponse: any): Promise<string | null> {
  // TODO parses the lambda response to see if there were any failures. If so, returns the details of the failure, else returns null.
  return null
}

async function runProvider(provider: string) {
  const urls = await getUrlsForProvider(provider)
  const retryCount = {}
  const retries: string[] = [] // list of URLs we want to retry
  const successes = [] // list of successes
  const fails = [] // list of failures
  const promises: Promise<void>[] = []
  let inprog = 0
  async function* generateUrls() {
    for (const url of urls) {
      yield url
      await bluebird.delay(URL_DELAY)
    }

    while (true) {
      // handle retries
      if (retries.length) {
        const [url] = retries.splice(0, 1)
        yield url
        await bluebird.delay(URL_DELAY)
      } else if (inprog == 0) {
        break
      }
      await bluebird.delay(100)
    }
  }

  // this URL failed with an error, either retry it or mark as failed
  function fail(url: string, error: any) {
    console.log(`fail: ${url}`)
    retryCount[url] = retryCount[url] ?? 0
    retryCount[url]++
    if (retryCount[url] > MAX_RETRY_COUNT) {
      fails.push({ url, error })
      if (fails.length > MAX_FAILS) {
        throw new Error('Excessive Failures')
      }
    } else {
      retries.push(url)
    }
  }

  // this URL was crawled successfully
  function success(url: string, response: any) {
    console.log(`success: ${url}`)
    successes.push({ url, response })
  }

  async function doScrape(url: string): Promise<void> {
    inprog++
    try {
      const { FunctionError, Payload } = await tryScrape(url, provider)
      const response = JSON.parse(Payload.toString())
      const failure = FunctionError || (await getFailure(Payload))
      if (failure) {
        return fail(url, failure)
      }
      return success(url, response)
    } catch (e) {
      if (e.message === 'Excessive Failures') throw e
      return fail(url, e)
    } finally {
      inprog--
    }
  }

  for await (const url of generateUrls()) {
    promises.push(doScrape(url))
  }
  await Promise.all(promises)
}

bluebird.mapSeries(providers, runProvider)
