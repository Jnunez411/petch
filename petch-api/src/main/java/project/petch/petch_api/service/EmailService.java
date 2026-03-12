package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@petch.com}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Petch - Reset Your Password");
            helper.setText(buildResetEmailHtml(resetLink), true);

            mailSender.send(mimeMessage);
            log.info("Password reset email sent to: {}", toEmail.replaceAll("(?<=.{3}).(?=.*@)", "*"));
        } catch (MessagingException e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
            throw new RuntimeException("Failed to send password reset email. Please try again later.");
        }
    }

    private String buildResetEmailHtml(String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%%;">

                          <!-- Top Border with Logo -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #FF6B6B, #E85555); border-radius: 12px 12px 0 0; padding: 24px 40px; text-align: center;">
                              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                  <td style="background-color: rgba(255,255,255,0.2); border-radius: 8px; width: 36px; height: 36px; text-align: center; vertical-align: middle;">
                                    <img src="https://api.iconify.design/lucide/dog.svg?color=white&width=22&height=22" alt="Petch" width="22" height="22" style="display: block; margin: 0 auto;" />
                                  </td>
                                  <td style="padding-left: 10px;">
                                    <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Petch</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- Email Body -->
                          <tr>
                            <td style="background-color: #ffffff; padding: 40px;">
                              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600;">Reset Your Password</h2>
                              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                                We received a request to reset the password for your Petch account. Click the button below to set a new password.
                              </p>

                              <!-- Reset Button -->
                              <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                <tr>
                                  <td align="center">
                                    <a href="%s" style="display: inline-block; background-color: #FF6B6B; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 40px; border-radius: 8px;">
                                      Reset Password
                                    </a>
                                  </td>
                                </tr>
                              </table>

                              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 1.6;">
                                This link will expire in <strong>30 minutes</strong>.
                              </p>
                              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 1.6;">
                                If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                              </p>

                              <!-- Fallback Link -->
                              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                              </p>
                              <p style="margin: 4px 0 0; word-break: break-all; color: #FF6B6B; font-size: 12px;">
                                %s
                              </p>
                            </td>
                          </tr>

                          <!-- Bottom Border -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #FF6B6B, #E85555); border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center;">
                              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">
                                Find your perfect furry companion.
                              </p>
                              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.6); font-size: 12px;">
                                &copy; 2026 Petch. All rights reserved.
                              </p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(resetLink, resetLink);
    }
}
