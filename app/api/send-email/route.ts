/**
 * Email API Route
 * 
 * Handles sending transactional emails via Resend for:
 * - Beat ready for review notifications
 * - Revision completed notifications
 * - Client response notifications (to admin)
 * - Refund initiated confirmations
 * 
 * @route POST /api/send-email
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * Lazy initialization of Resend client
 * Only creates instance when API is called, not during build
 */
let resendClient: Resend | null = null

const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    
    resendClient = new Resend(apiKey)
  }
  
  return resendClient
}

/**
 * Email template data interface
 */
interface EmailData {
  requestId: string
  requestTitle: string
  userName: string
  beatTitle?: string
  response?: 'approved' | 'revision' | 'rejected'
}

/**
 * Email template response
 */
interface EmailTemplate {
  subject: string
  html: string
}

/**
 * Generate email template based on type
 * 
 * @param type - Email template type
 * @param data - Template data
 * @returns Email template with subject and HTML
 */
const getEmailTemplate = (type: string, data: EmailData): EmailTemplate | null => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meckurybeats.com'
  
  switch (type) {
    case 'ready_for_review':
      return {
        subject: `🎵 Your Custom Beat is Ready! - ${data.requestTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Beat is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">🎵 Your Beat is Ready!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                Hey ${data.userName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                Great news! Meckury has finished creating your custom beat: <strong style="color: #ef4444;">"${data.beatTitle || data.requestTitle}"</strong>
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 30px; color: #e5e5e5;">
                It's time to listen and let us know what you think. You have <strong>48 hours</strong> to respond with one of these options:
              </p>
              
              <!-- Options -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #0d4d2b; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 15px; color: #10b981;">
                      <strong>✓ Love it!</strong> - Pay the remaining balance and own it
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #3b0764; border-radius: 8px; margin: 10px 0;">
                    <p style="margin: 0; font-size: 15px; color: #a855f7;">
                      <strong>🔄 Request Revision</strong> - One free revision available
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #450a0a; border-radius: 8px; margin-top: 10px;">
                    <p style="margin: 0; font-size: 15px; color: #ef4444;">
                      <strong>✗ Pass</strong> - We'll make a new beat (or refund after 2nd pass)
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/dashboard/beat-requests/${data.requestId}/review" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                      Listen & Review Now →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #333333; color: #9ca3af;">
                <strong>Need help?</strong> Reply to this email or contact us through the website.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Meckury Beats. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #4b5563;">
                You received this email because you requested a custom beat.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }

    case 'revision_completed':
      return {
        subject: `✨ Your Beat Revision is Ready! - ${data.requestTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revision Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">✨ Revision Complete!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                Hey ${data.userName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                Meckury has updated your beat: <strong style="color: #a855f7;">"${data.beatTitle || data.requestTitle}"</strong>
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 30px; color: #e5e5e5;">
                The changes you requested have been made. Listen to the updated version and let us know if you're ready to own it!
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/dashboard/beat-requests/${data.requestId}/review" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(168, 85, 247, 0.3);">
                      Listen to Revision →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding: 15px; background-color: #450a0a; border-left: 4px solid #ef4444; border-radius: 4px; color: #fca5a5;">
                ⚠️ <strong>Important:</strong> This is your final chance to review. If you pass on this version, you'll receive a full refund.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #0a0a0a; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Meckury Beats. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }

    case 'client_response':
      // Email to admin when client responds
      return {
        subject: `Client Response: ${data.response?.toUpperCase()} - ${data.requestTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client Response</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
          
          <tr>
            <td style="background-color: #333333; padding: 30px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff;">
                Client Response Received
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; margin: 0 0 20px; color: #e5e5e5;">
                A client has responded to their beat request:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; background-color: #0a0a0a; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Request:</p>
                    <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">${data.requestTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px;">
                    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Response:</p>
                    <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: ${
                      data.response === 'approved' ? '#10b981' : 
                      data.response === 'revision' ? '#a855f7' : '#ef4444'
                    }; text-transform: uppercase;">
                      ${data.response === 'approved' ? '✓ APPROVED' : 
                        data.response === 'revision' ? '🔄 REVISION REQUESTED' : '✗ PASSED'}
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/admin/beat-requests/${data.requestId}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px;">
                      View Request Details →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }

    case 'refund_initiated':
      return {
        subject: `Refund Initiated - ${data.requestTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Initiated</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
          
          <tr>
            <td style="background-color: #0d4d2b; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">💸 Refund Processing</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                Hey ${data.userName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #e5e5e5;">
                We're sorry we couldn't create the perfect beat for you this time. Your full refund of <strong style="color: #10b981;">₦10,000</strong> has been initiated.
              </p>
              
              <div style="background-color: #0a0a0a; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #10b981;">
                  <strong>Refund Timeline:</strong> You should receive your money within 5-7 business days.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 0; color: #e5e5e5;">
                We'd love to work with you again in the future. Check out our regular beat store or book a studio session for a more hands-on experience.
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/beats" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px; margin-right: 10px;">
                      Browse Beats
                    </a>
                    <a href="${baseUrl}/studio" style="display: inline-block; background-color: #a855f7; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px;">
                      Book Studio
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #0a0a0a; padding: 30px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Meckury Beats. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }

    default:
      return null
  }
}

/**
 * POST endpoint for sending emails
 * 
 * @param request - Next.js request object
 * @returns JSON response with success/error status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, ...data } = body

    // Validate required fields
    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type and to' },
        { status: 400 }
      )
    }

    // Get email template
    const template = getEmailTemplate(type, data)
    
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    // Determine recipient
    let recipient = to
    
    // For admin notifications, send to admin email
    if (type === 'client_response') {
      recipient = process.env.ADMIN_EMAIL || 'admin@meckurybeats.com'
    }

    // Get Resend client (lazy initialization)
    const resend = getResendClient()

    // Determine sender email based on environment
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Meckury Beats <noreply@meckurybeats.com>'

    // Send email via Resend
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully:', {
      type,
      to: recipient,
      emailId: emailData?.id
    })

    return NextResponse.json({ 
      success: true, 
      data: emailData,
      message: 'Email sent successfully'
    })
  } catch (error: any) {
    console.error('❌ Email API error:', error)
    
    // Return more specific error messages
    if (error.message?.includes('RESEND_API_KEY')) {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
