import * as nodemailer from 'nodemailer';

/**
 * Fix for Nodemailer 10 IPv6 ENETUNREACH bug on macOS and environments without IPv6 internet routing:
 * Nodemailer considers link-local IPv6 addresses (fe80::) as valid external IPv6 interfaces.
 * When it does, it attempts to resolve and connect to public mail servers (e.g. Gmail) via IPv6,
 * which immediately fails with ENETUNREACH.
 * This function strips link-local addresses so Nodemailer correctly recognizes IPv6 as unsupported and uses IPv4.
 */
export function patchNodemailerIpv6(): void {
  try {
    const sharedKey = Object.keys(require.cache).find((k) => k.includes('shared'));
    if (sharedKey && require.cache[sharedKey]?.exports?.networkInterfaces) {
      const ifaces = require.cache[sharedKey].exports.networkInterfaces;
      for (const name of Object.keys(ifaces)) {
        ifaces[name] = ifaces[name].filter(
          (addr: any) => !(addr.family === 'IPv6' && addr.address?.toLowerCase().startsWith('fe80:')),
        );
      }
    }
  } catch {
    // Ignore if module cache inspection fails
  }
}

export function createMailTransporter(): nodemailer.Transporter {
  patchNodemailerIpv6();

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      servername: process.env.SMTP_HOST || 'smtp.gmail.com',
    },
  });
}
