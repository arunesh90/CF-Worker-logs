// Modified version from https://gist.github.com/mhart/1b3bbfbdfa6825baab003b5f55a15322
const SENTRY_PROJECT_ID = process.env.SENTRY_PROJECT_ID
const SENTRY_KEY = process.env.SENTRY_KEY
const ENV = process.env.NODE_ENV === 'production' ? 'development' : 'production'

// Indicates the name of the SDK client
const CLIENT_NAME = 'mhart-cloudflare-worker'
const CLIENT_VERSION = '1.0.0'
const RETRIES = 5

export async function sentryLog(
  err: Error,
  request?: Request,
  extra?: { [key: string]: any }
) {
  const sentryEvent = toSentryEvent(err, request, extra)
  const body = JSON.stringify(sentryEvent)
  console.error(err, sentryEvent)

  for (let i = 0; i <= RETRIES; i++) {
    const res = await fetch(
      `https://sentry.io/api/${SENTRY_PROJECT_ID}/store/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': [
            'Sentry sentry_version=7',
            `sentry_client=${CLIENT_NAME}/${CLIENT_VERSION}`,
            `sentry_key=${SENTRY_KEY}`,
          ].join(', '),
        },
        body,
      }
    )
    if (res.status === 200) {
      return
    }
    // We couldn't send to Sentry, try to log the response at least
    console.error({ httpStatus: res.status, ...(await res.json()) })
  }
}

function toSentryEvent(
  err: Error,
  request?: Request,
  extra?: { [key: string]: any }
) {
  // @ts-ignore
  const errType = err.name || (err.contructor || {}).name
  const frames = parse(err)
  const extraKeys = Object.keys(err).filter(
    key => !['name', 'message', 'stack'].includes(key)
  )

  let extraInfo: any = {
    ...extra,
  }

  if (extraKeys.length) {
    extraInfo[errType] = extraKeys.reduce(
      (obj, key) => ({ ...obj, [key]: err[key as keyof Error] }),
      {}
    )
  }

  return {
    event_id: uuidv4(),
    message: errType + ': ' + (err.message || '<no message>'),
    exception: {
      values: [
        {
          type: errType,
          value: err.message,
          stacktrace: frames.length ? { frames: frames.reverse() } : undefined,
        },
      ],
    },
    extra: extraInfo,
    platform: 'javascript',
    environment: ENV,
    timestamp: Date.now() / 1000,
    request:
      request && request.url
        ? {
            method: request.method,
            url: request.url,
            headers: request.headers,
            data: request.body,
          }
        : undefined,
  }
}

function parse(err: Error) {
  return (err.stack || '')
    .split('\n')
    .slice(1)
    .map(line => {
      if (line.match(/^\s*[-]{4,}$/)) {
        return { filename: line }
      }

      // From https://github.com/felixge/node-stack-trace/blob/1ec9ba43eece124526c273c917104b4226898932/lib/stack-trace.js#L42
      const lineMatch = line.match(
        /at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/
      )
      if (!lineMatch) {
        return
      }

      return {
        function: lineMatch[1] || undefined,
        filename: lineMatch[2] || undefined,
        lineno: +lineMatch[3] || undefined,
        colno: +lineMatch[4] || undefined,
        in_app: lineMatch[5] !== 'native' || undefined,
      }
    })
    .filter(Boolean)
}

function uuidv4() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map(b => ('0' + b.toString(16)).slice(-2)).join('') // to hex
}
