export const APP_SCHEME = "loveverse";

// Replace with your real hosted links after first build upload.
export const APK_DOWNLOAD_URL = "https://expo.dev/artifacts/eas/oPzWsZ61qx7LByWkfmTYax.apk";
export const INVITE_WEB_BASE_URL = "https://alinadeem13.github.io/React-Native-App/invite.html";

export function buildInviteLinks(code) {
  const inviteCode = String(code || "").trim().toUpperCase();

  return {
    code: inviteCode,
    appDeepLink: `${APP_SCHEME}://invite/${inviteCode}`,
    webInviteLink: `${INVITE_WEB_BASE_URL}?code=${inviteCode}`,
    apkDownloadLink: APK_DOWNLOAD_URL
  };
}
