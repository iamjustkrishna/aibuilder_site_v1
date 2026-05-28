const fs = require('fs');
const path = require('path');
const tls = require('tls');
const { createClient } = require('@supabase/supabase-js');

// ----------------------------------------------------
// 1. ENVIRONMENT CONFIGURATION & PARSING
// ----------------------------------------------------
// Manually load .env.local if it exists (great for local developer dry-runs)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment from .env.local...');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);

// Validate minimum required configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}
if (!SMTP_USER || !SMTP_PASSWORD) {
  console.error('Error: SMTP_USER and SMTP_PASSWORD are required.');
  process.exit(1);
}

// ----------------------------------------------------
// 2. SMTP CLIENT IMPLEMENTATION (SSL/TLS Port 465)
// ----------------------------------------------------
function encodeMimeWord(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMimeMessage(senderEmail, recipientEmail, subject, name) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  
  const textBody = `Hey ${name || 'Builder'},\n\n` +
    `You haven't submitted your project for the current cohort showcase yet!\n\n` +
    `Make sure to showcase your amazing AI applications and autonomous agents to our community. Head to your profile dashboard, add your project, and get displayed in our showcase.\n\n` +
    `Go to your profile: https://aibuilder.space/dashboard/profile\n\n` +
    `Thanks,\nAIBuilder Team\n\n` +
    `---\n` +
    `You received this email because automatic updates are enabled. If you no longer wish to receive these reminders, you can turn them off anytime directly from your profile dashboard settings.`;

  const htmlBody = `
    <html>
      <body style="font-family: 'Outfit', 'Inter', Arial, sans-serif; color: #1A0A3D; line-height: 1.6; background-color: #F4F1FB; margin: 0; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(73, 43, 140, 0.05); border: 1px solid #E8E3F3;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #492B8C 0%, #2D1A69 100%); padding: 32px; text-align: center;">
              <span style="color: #FFD13F; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 8px;">Showcase Submission</span>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; font-family: var(--font-cal-sans), Arial, sans-serif;">Let's showcase your build!</h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 32px 32px 32px;">
              <p style="font-size: 16px; margin-top: 0; color: #1A0A3D; font-weight: 600;">Hey ${escapeHtml(name || 'Builder')},</p>
              <p style="font-size: 15px; color: #6B5B9E; margin-bottom: 24px; leading-relaxed: true;">
                You haven't submitted your project for the current cohort showcase yet! We don't want you to miss out on displaying your amazing AI applications and autonomous agents to our community.
              </p>
              
              <!-- Call to Action -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 32px auto;">
                <tr>
                  <td align="center" style="background-color: #492B8C; border-radius: 9999px;">
                    <a href="https://aibuilder.space/dashboard/profile" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                      Submit Your Project Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6B5B9E; margin-top: 24px;">
                Adding a project takes less than 2 minutes. Once published, your profile and builds will be visible in our graduation showcase.
              </p>
              <p style="font-size: 15px; color: #1A0A3D; font-weight: 600; margin-top: 32px; margin-bottom: 0;">
                Keep building,<br />
                <span style="color: #492B8C;">AIBuilder Team</span>
              </p>
            </td>
          </tr>
          <!-- Footer Opt-Out -->
          <tr>
            <td style="background-color: #FFF8F2; padding: 24px 32px; border-top: 1px solid #E8E3F3; text-align: center;">
              <p style="font-size: 12px; color: #8A7CB5; margin: 0 0 8px 0; line-height: 1.5;">
                You received this email because automatic updates are enabled. 
              </p>
              <p style="font-size: 12px; margin: 0;">
                <a href="https://aibuilder.space/dashboard/profile" target="_blank" style="color: #FF6B34; font-weight: 700; text-decoration: none;">
                  Unsubscribe / Turn off updates in your Profile settings &rarr;
                </a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return [
    `From: AIBuilder <${senderEmail}>`,
    `To: ${recipientEmail}`,
    `Subject: ${encodeMimeWord(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody.trim(),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

function createLineReader(socket) {
  socket.setEncoding('utf8');
  let buffer = '';
  const queuedLines = [];
  const waiters = [];
  let terminalError = null;

  const flush = () => {
    while (queuedLines.length && waiters.length) {
      waiters.shift().resolve(queuedLines.shift());
    }
  };

  socket.on('data', chunk => {
    buffer += chunk;
    let index = buffer.indexOf('\r\n');
    while (index >= 0) {
      queuedLines.push(buffer.slice(0, index));
      buffer = buffer.slice(index + 2);
      index = buffer.indexOf('\r\n');
    }
    flush();
  });

  const rejectAll = error => {
    terminalError = error;
    while (waiters.length) {
      waiters.shift().reject(error);
    }
  };

  socket.on('error', rejectAll);
  socket.on('close', () => {
    if (!terminalError) {
      rejectAll(new Error('SMTP connection closed unexpectedly'));
    }
  });

  return {
    readLine() {
      if (queuedLines.length) return Promise.resolve(queuedLines.shift());
      if (terminalError) return Promise.reject(terminalError);
      return new Promise((resolve, reject) => {
        waiters.push({ resolve, reject });
      });
    },
  };
}

async function readResponse(reader) {
  const lines = [];
  while (true) {
    const line = await reader.readLine();
    lines.push(line);
    if (/^\d{3} /.test(line)) {
      return {
        code: parseInt(line.slice(0, 3), 10),
        message: lines.join('\n'),
      };
    }
  }
}

async function sendCommand(socket, reader, command, expectedCodes) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(reader);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed: ${response.message}`);
  }
  return response;
}

async function sendSmtpEmail({ host, port, user, password, recipientEmail, subject, name }) {
  const socket = tls.connect({ host, port, servername: host });

  await new Promise((resolve, reject) => {
    socket.once('secureConnect', resolve);
    socket.once('error', reject);
  });

  const reader = createLineReader(socket);
  const greeting = await readResponse(reader);
  if (greeting.code !== 220) {
    throw new Error(`SMTP greeting failed: ${greeting.message}`);
  }

  await sendCommand(socket, reader, 'EHLO localhost', [250]);
  await sendCommand(socket, reader, 'AUTH LOGIN', [334]);
  await sendCommand(socket, reader, Buffer.from(user, 'utf8').toString('base64'), [334]);
  await sendCommand(socket, reader, Buffer.from(password, 'utf8').toString('base64'), [235]);
  await sendCommand(socket, reader, `MAIL FROM:<${user}>`, [250]);
  await sendCommand(socket, reader, `RCPT TO:<${recipientEmail}>`, [250, 251]);
  await sendCommand(socket, reader, 'DATA', [354]);

  const message = buildMimeMessage(user, recipientEmail, subject, name);
  const normalizedMessage = message.replace(/\r?\n/g, '\r\n');
  const safeMessage = normalizedMessage
    .split('\r\n')
    .map(line => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');

  socket.write(`${safeMessage}\r\n.\r\n`);
  const dataResponse = await readResponse(reader);
  if (dataResponse.code !== 250) {
    throw new Error(`SMTP DATA failed: ${dataResponse.message}`);
  }

  await sendCommand(socket, reader, 'QUIT', [221]);
  socket.end();
}

// Helper pause to respect SMTP servers rate-limits
async function pause(ms) {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------------------------
// 3. CORE LOGIC EXECUTOR
// ----------------------------------------------------
async function main() {
  console.log('Initializing Supabase client...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  console.log('Fetching the active current cohort...');
  const { data: cohort, error: cohortError } = await supabase
    .from('cohorts')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  if (cohortError) {
    console.error('Error fetching current cohort:', cohortError.message);
    process.exit(1);
  }

  if (!cohort) {
    console.log('No current active cohort found. Exiting gracefully.');
    process.exit(0);
  }

  console.log(`Current Cohort: "${cohort.name}" (${cohort.code})`);
  console.log(`Project Submission status: ${cohort.project_submission_active ? 'ON' : 'OFF'}`);

  if (!cohort.project_submission_active) {
    console.log('Project submission is currently closed/OFF for this cohort. No reminder emails will be sent.');
    process.exit(0);
  }

  console.log('Fetching enrolled active users...');
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('cohort_enrollments')
    .select('user_id')
    .eq('cohort_id', cohort.id)
    .eq('enrollment_status', 'active');

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError.message);
    process.exit(1);
  }

  const enrolledUserIds = (enrollments || []).map(e => e.user_id);
  if (enrolledUserIds.length === 0) {
    console.log('No active users are currently enrolled in this cohort. Exiting.');
    process.exit(0);
  }

  console.log(`Found ${enrolledUserIds.length} active enrolled users. Fetching profiles & project submissions...`);

  // Fetch full details in parallel
  const [
    { data: users, error: usersError },
    { data: profiles, error: profilesError },
    { data: projects, error: projectsError }
  ] = await Promise.all([
    supabase.from('users').select('id, email, full_name').in('id', enrolledUserIds),
    supabase.from('user_profiles').select('user_id, receive_automatic_emails').in('user_id', enrolledUserIds),
    supabase.from('user_projects').select('user_id').eq('cohort_id', cohort.id)
  ]);

  if (usersError) {
    console.error('Error fetching users:', usersError.message);
    process.exit(1);
  }

  const submittedUserIds = new Set((projects || []).map(p => p.user_id));
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  // Filter users to get those who need a reminder
  const targetUsers = (users || []).filter(user => {
    // 1. Must have an email
    if (!user.email) return false;

    // 2. Must NOT have submitted a project for this cohort
    if (submittedUserIds.has(user.id)) return false;

    // 3. Must NOT have disabled automatic reminder emails
    const profile = profileMap.get(user.id);
    if (profile && profile.receive_automatic_emails === false) {
      console.log(`User ${user.email} has disabled automatic email updates. Skipping.`);
      return false;
    }

    return true;
  });

  console.log(`Identified ${targetUsers.length} users who have not submitted a project and are opted-in to emails.`);

  if (targetUsers.length === 0) {
    console.log('All active users have already submitted a project or opted out of reminders. Exiting.');
    process.exit(0);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < targetUsers.length; i++) {
    const user = targetUsers[i];
    console.log(`[${i + 1}/${targetUsers.length}] Sending project reminder to ${user.email} (${user.full_name || 'Builder'})...`);

    try {
      await sendSmtpEmail({
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER,
        password: SMTP_PASSWORD,
        recipientEmail: user.email,
        subject: 'Submit your project for the showcase!',
        name: user.full_name,
      });

      console.log(` Successfully sent reminder to ${user.email}`);
      sentCount++;
    } catch (sendError) {
      console.error(` Failed to send email to ${user.email}:`, sendError.message);
      failedCount++;
    }

    // Rate-limit pauses: wait 2 seconds between emails to respect Hostinger rate-limits
    if (i < targetUsers.length - 1) {
      await pause(2000);
    }
  }

  console.log('\n=======================================');
  console.log('Automated Reminder Run Complete');
  console.log(`Total Target Users: ${targetUsers.length}`);
  console.log(`Successfully Sent:  ${sentCount}`);
  console.log(`Failed to Send:     ${failedCount}`);
  console.log('=======================================');
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
