package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import project.petch.petch_api.models.Pets;
import java.util.List;

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

    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Petch! 🐾");
            helper.setText(buildWelcomeEmailHtml(firstName), true);

            mailSender.send(mimeMessage);
            log.info("Welcome email sent to: {}", toEmail.replaceAll("(?<=.{3}).(?=.*@)", "*"));
        } catch (MessagingException e) {
            log.error("Failed to send welcome email: {}", e.getMessage());
            // Don't throw - welcome email failure shouldn't block registration
        }
    }

    public void sendPetMatchEmail(String toEmail, String firstName, List<Pets> matchingPets) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Petch - New Pets Match Your Preferences!");
            helper.setText(buildPetMatchEmailHtml(firstName, matchingPets), true);

            mailSender.send(mimeMessage);
            log.info("Pet match email sent to: {}", toEmail.replaceAll("(?<=.{3}).(?=.*@)", "*"));
        } catch (MessagingException e) {
            log.error("Failed to send pet match email: {}", e.getMessage());
        }
    }

    private String buildWelcomeEmailHtml(String firstName) {
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
                              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600;">Welcome to Petch, %s!</h2>
                              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                                We're thrilled to have you join the Petch community! Your account has been created successfully.
                              </p>
                              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                                Start exploring adorable pets looking for their forever homes. Swipe through our discover feed, save your favorites, and find your perfect furry companion.
                              </p>

                              <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                <tr>
                                  <td style="background-color: #fef2f2; border-radius: 8px; padding: 20px;">
                                    <p style="margin: 0 0 8px; color: #18181b; font-size: 15px; font-weight: 600;">Here's what you can do:</p>
                                    <ul style="margin: 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
                                      <li>Discover pets tailored to your preferences</li>
                                      <li>Save your favorite pets for later</li>
                                      <li>Connect with shelters and vendors</li>
                                      <li>Get notified when new pets match your taste</li>
                                    </ul>
                                  </td>
                                </tr>
                              </table>

                              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                                If you have any questions, feel free to reach out. Happy pet searching!
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
                """.formatted(firstName);
    }

    private String buildPetMatchEmailHtml(String firstName, List<Pets> pets) {
        StringBuilder petCards = new StringBuilder();
        for (Pets pet : pets) {
            petCards.append("""
                    <tr>
                      <td style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                        <p style="margin: 0 0 4px; color: #18181b; font-size: 16px; font-weight: 600;">%s</p>
                        <p style="margin: 0; color: #52525b; font-size: 14px;">%s &middot; %s &middot; %d year(s) old</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    """.formatted(pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getAge()));
        }

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
                              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600;">New Pet Match, %s!</h2>
                              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                                Great news! New pets have been added that match your preferences. Check them out:
                              </p>

                              <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                %s
                              </table>

                              <p style="margin: 0 0 16px; color: #71717a; font-size: 14px; line-height: 1.6;">
                                Log in to Petch to see more details and start your adoption journey!
                              </p>

                              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                              <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                                You received this email because you have pet match notifications enabled. You can turn this off in your account settings.
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
                """.formatted(firstName, petCards.toString());
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
