import tls from "node:tls"

type SmtpResponse = {
  code: number
  message: string
}

function encodeMimeWord(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function toHtmlBody(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br />")
}

function buildMimeMessage(options: {
  senderEmail: string
  recipientEmail: string
  subject: string
  subtitle?: string
  body: string
  htmlTemplate?: string
}) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const plainText = [options.subtitle, options.body].filter(Boolean).join("\n\n")
  const html = options.htmlTemplate
    ? options.htmlTemplate
    : `
      <html>
        <body style="font-family: Arial, sans-serif; color: #1A0A3D; line-height: 1.6;">
          <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 24px; margin: 0 0 12px;">${escapeHtml(options.subject)}</h1>
            ${options.subtitle ? `<p style="font-size: 15px; color: #6B5B9E; margin: 0 0 20px;">${escapeHtml(options.subtitle)}</p>` : ""}
            <div style="font-size: 15px;">${toHtmlBody(options.body)}</div>
          </div>
        </body>
      </html>
    `

  return [
    `From: AIBuilder <${options.senderEmail}>`,
    `To: ${options.recipientEmail}`,
    `Subject: ${encodeMimeWord(options.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    plainText,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n")
}

function createLineReader(socket: tls.TLSSocket) {
  socket.setEncoding("utf8")

  let buffer = ""
  const queuedLines: string[] = []
  const waiters: Array<{ resolve: (line: string) => void; reject: (error: Error) => void }> = []
  let terminalError: Error | null = null

  const flush = () => {
    while (queuedLines.length && waiters.length) {
      waiters.shift()!.resolve(queuedLines.shift()!)
    }
  }

  socket.on("data", (chunk: string) => {
    buffer += chunk
    let index = buffer.indexOf("\r\n")
    while (index >= 0) {
      queuedLines.push(buffer.slice(0, index))
      buffer = buffer.slice(index + 2)
      index = buffer.indexOf("\r\n")
    }
    flush()
  })

  const rejectAll = (error: Error) => {
    terminalError = error
    while (waiters.length) {
      waiters.shift()!.reject(error)
    }
  }

  socket.on("error", rejectAll)
  socket.on("close", () => {
    if (!terminalError) {
      rejectAll(new Error("SMTP connection closed unexpectedly"))
    }
  })

  return {
    readLine() {
      if (queuedLines.length) {
        return Promise.resolve(queuedLines.shift()!)
      }

      if (terminalError) {
        return Promise.reject(terminalError)
      }

      return new Promise<string>((resolve, reject) => {
        waiters.push({ resolve, reject })
      })
    },
  }
}

async function readResponse(reader: ReturnType<typeof createLineReader>): Promise<SmtpResponse> {
  const lines: string[] = []

  while (true) {
    const line = await reader.readLine()
    lines.push(line)
    if (/^\d{3} /.test(line)) {
      return {
        code: Number.parseInt(line.slice(0, 3), 10),
        message: lines.join("\n"),
      }
    }
  }
}

async function sendCommand(
  socket: tls.TLSSocket,
  reader: ReturnType<typeof createLineReader>,
  command: string,
  expectedCodes: number[],
) {
  socket.write(`${command}\r\n`)
  const response = await readResponse(reader)
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed: ${response.message}`)
  }
  return response
}

export async function sendGmailMessage(options: {
  senderEmail: string
  appPassword: string
  recipientEmail: string
  subject: string
  subtitle?: string
  body: string
  htmlTemplate?: string
}) {
  const socket = tls.connect({
    host: "smtp.gmail.com",
    port: 465,
    servername: "smtp.gmail.com",
  })

  await new Promise<void>((resolve, reject) => {
    socket.once("secureConnect", resolve)
    socket.once("error", reject)
  })

  const reader = createLineReader(socket)
  const greeting = await readResponse(reader)
  if (greeting.code !== 220) {
    throw new Error(`SMTP greeting failed: ${greeting.message}`)
  }

  await sendCommand(socket, reader, "EHLO localhost", [250])
  await sendCommand(socket, reader, "AUTH LOGIN", [334])
  await sendCommand(socket, reader, Buffer.from(options.senderEmail, "utf8").toString("base64"), [334])
  await sendCommand(socket, reader, Buffer.from(options.appPassword, "utf8").toString("base64"), [235])
  await sendCommand(socket, reader, `MAIL FROM:<${options.senderEmail}>`, [250])
  await sendCommand(socket, reader, `RCPT TO:<${options.recipientEmail}>`, [250, 251])
  await sendCommand(socket, reader, "DATA", [354])

  const message = buildMimeMessage(options)
  const normalizedMessage = message.replace(/\r?\n/g, "\r\n")
  const safeMessage = normalizedMessage
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n")
  socket.write(`${safeMessage}\r\n.\r\n`)
  const dataResponse = await readResponse(reader)
  if (dataResponse.code !== 250) {
    throw new Error(`SMTP DATA failed: ${dataResponse.message}`)
  }

  await sendCommand(socket, reader, "QUIT", [221])
  socket.end()
}

