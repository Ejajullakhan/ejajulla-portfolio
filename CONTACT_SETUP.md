# Contact email setup

The existing Contact section sends through the server-side `/api/contact` endpoint. The browser never receives the Resend API key.

Add these environment variables in the WebDev/Vercel project settings:

| Variable | Required | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | A Resend API key with permission to send email. |
| `RESEND_FROM_EMAIL` | Yes | A sender identity verified in Resend, for example `Ejajulla Khan <hello@yourdomain.com>`. |
| `CONTACT_EMAIL` | Yes | The inbox that should receive portfolio messages. |

The endpoint validates and sanitizes name, email, and message fields, caps message length at 5,000 characters, rejects invalid email addresses, ignores the hidden honeypot field when populated, rate-limits repeated submissions in the current server instance, and returns clean JSON errors. The notification includes the visitor name, visitor email as Reply-To, message, and UTC receipt time.

For Vercel, add the three variables under **Project Settings → Environment Variables**, select the environments where the form should work, and redeploy. The sender domain or address must be verified in Resend before production submissions can be delivered.
