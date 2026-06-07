/**
 * Disposable / temporary email domain blocklist.
 *
 * Checked on every user.created Clerk webhook to prevent throwaway-email
 * signups before they ever land in the database.
 *
 * To add more domains: append to DISPOSABLE_DOMAINS and redeploy.
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "mailinator.net", "mailinator.org",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "guerrillamailblock.com", "grr.la", "spam4.me", "sharklasers.com",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmailer.com",
  "throwaway.email", "throwam.com",
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  "discard.email", "dispostable.com",
  "trashmail.com", "trashmail.at", "trashmail.io", "trashmail.me",
  "trashmail.net", "trashmail.org", "trashmail.xyz", "trash-mail.at",
  "fakeinbox.com", "fakemail.net", "fakemailgenerator.com",
  "maildrop.cc", "mailnesia.com", "mailnull.com",
  "10minutemail.com", "10minutemail.net", "10minutemail.org",
  "20minutemail.com",
  "spamgourmet.com", "spamgap.com", "spamspot.com", "spamevader.com",
  "spamfree24.org", "spamtrap.ro", "spam.la", "spambox.us",
  "spamthisplease.com", "binkmail.com",
  "mailscrap.com", "tempinbox.com", "tempail.com",
  "getairmail.com", "mailtemp.info", "mailtemp.net", "mailtemp.org",
  "getnada.com", "notsharingmy.info", "wh4f.org", "boun.cr",
  "inoutmail.com", "inoutmail.eu", "inoutmail.de", "inoutmail.info",
  "filzmail.com", "sogetthis.com", "trbvm.com",
  "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
  "anonmails.de",
  "mailboxy.fun", "mailimate.com",
  "mailhazard.com", "mailhazard.us",
  "throwam.com",
  "spamhereplease.com",
  "safetymail.info",
  "mt2015.com", "mt2016.com", "mt2017.com",
  "yepmail.net",
  "maildea.com",
  "meltmail.com",
  "tempr.email",
  "discardmail.com", "discardmail.de",
  "objectmail.com",
  "crazymailing.com",
  "mail-temporaire.fr",
  "jetable.net", "jetable.org", "jetable.com",
  "netzidiot.de",
  "weg-werf-email.de",
  "emailondeck.com",
  "spamgourmet.net", "spamgourmet.org",
  "maildrop.gq",
  "burnermail.io",
  "mohmal.com",
  "mailnew.com",
  "spamdecoy.net",
  "csh.ro",
  "jnxjn.com",
  "trashcanmail.com",
  "yopmail.net",
  "yopmail.com",
  "cool.fr.nf",
  "bobmail.info",
  "cheatmail.de",
  "tradermail.info",
  "allsimply.com",
  "tempemail.net",
  "tempemail.com",
  "tempinbox.net",
  "mailsac.com",
  "filzmail.com",
]);

/**
 * Returns true if the email address belongs to a known disposable / temporary
 * email provider. Matching is case-insensitive on the domain part only.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop()!.toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}
