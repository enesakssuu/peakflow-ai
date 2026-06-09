// ============================================================
// PeakFlow AI — Workspace Invitation Email API Route
// ============================================================

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, workspaceName, invitedEmail, invitedByUserName, role } = body;

    if (!invitedEmail || !workspaceName || !invitedByUserName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('RESEND_API_KEY is not configured in environment variables. Email invitation skipped.');
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'RESEND_API_KEY is missing. Invitation registered in database only.'
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://peakflow-ai.vercel.app';
    const loginUrl = `${appUrl}/login`;

    // Premium HTML Email Template matching PeakFlow AI aesthetics
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Join ${workspaceName} on PeakFlow AI</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0F172A;
            color: #F8FAFC;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            background-color: #0F172A;
            width: 100%;
            padding: 40px 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: #1E293B;
            border: 1px solid #334155;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          .logo {
            margin-bottom: 28px;
            font-size: 20px;
            font-weight: 800;
            color: #14B8A6;
            letter-spacing: -0.025em;
            display: inline-block;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 16px 0;
            color: #FFFFFF;
            letter-spacing: -0.025em;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #94A3B8;
            margin: 0 0 24px 0;
          }
          .highlight {
            color: #14B8A6;
            font-weight: 600;
          }
          .btn-container {
            margin-bottom: 28px;
          }
          .btn {
            display: inline-block;
            background-color: #14B8A6;
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 12px 30px;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            box-shadow: 0 4px 14px rgba(20, 184, 166, 0.3);
            text-align: center;
          }
          .btn:hover {
            background-color: #0D9488;
          }
          .footer {
            font-size: 11px;
            color: #64748B;
            border-top: 1px solid #334155;
            padding-top: 20px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo">⚡ PeakFlow AI</div>
            <h1>You&apos;ve been invited!</h1>
            <p>
              Hi there,
            </p>
            <p>
              <span class="highlight">${invitedByUserName}</span> has invited you to join the team workspace <span class="highlight">${workspaceName}</span> on PeakFlow AI as a <span class="highlight">${role}</span>.
            </p>
            <p>
              PeakFlow AI is an AI-powered work coach and collaborative space that helps teams manage tasks, track focused work sessions, and boost momentum together.
            </p>
            <div class="btn-container">
              <a href="${loginUrl}" class="btn" target="_blank">Accept Invitation</a>
            </div>
            <div class="footer">
              If you were not expecting this invitation, you can safely ignore this email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Call Resend REST API directly via fetch
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PeakFlow AI <onboarding@resend.dev>',
        to: invitedEmail,
        subject: `Invitation to join ${workspaceName} on PeakFlow AI`,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error response:', data);
      return NextResponse.json({ error: data.message || 'Failed to send email' }, { status: response.status });
    }

    return NextResponse.json({ success: true, emailSent: true, id: data.id });
  } catch (err: any) {
    console.error('Workspace invitation sync error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
