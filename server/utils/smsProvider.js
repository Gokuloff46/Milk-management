// Simple SMS provider wrapper
// - If OTP_DEMO=true in env, caller may still receive demoOtp.
// - This file is a stub: it logs the SMS and returns success. You can extend it to integrate Twilio or another provider.

export async function sendSms(mobile, message) {
  try {
    // Demo mode: expose OTP in logs
    const allowDemo = process.env.OTP_DEMO === 'true' || process.env.OTP_DEMO === '1';
    if (allowDemo) {
      console.log(`[smsProvider] Demo OTP for ${mobile}: ${message}`);
      return { success: true, demoOtp: message.match(/\d{6}/)?.[0] || null };
    }

    // Production: replace with real provider integration
    console.log(`[smsProvider] Sending SMS to ${mobile}: ${message}`);
    // Simulate async send
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  } catch (err) {
    console.error('[smsProvider] Failed to send SMS', err);
    return { success: false, error: err.message };
  }
}
