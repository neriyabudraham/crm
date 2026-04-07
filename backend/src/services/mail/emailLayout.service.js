/**
 * Shared email layout for Botomat CRM emails — branded RTL layout.
 * Adapted from FlowBotomat. Uses the CRM accent colors instead of teal.
 */

const APP_URL = process.env.APP_URL || 'https://crm.botomat.co.il';
const FRONTEND_URL = process.env.FRONTEND_URL || APP_URL;

const COLORS = {
  primary: '#f59e0b',       // Amber — matches CRM accent
  primaryDark: '#d97706',
  primaryLight: '#fef3c7',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',
  textDark: '#111827',
  textMedium: '#374151',
  textLight: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  bgLight: '#f9fafb',
  bgWhite: '#ffffff',
};

function wrapInLayout(options) {
  const {
    content,
    headerTitle = '',
    headerSubtitle = '',
    headerColor = '#111827',
    headerColorEnd = '#1f2937',
    headerIcon = '',
    preheader = '',
    footerExtra = '',
  } = options;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle || 'Botomat CRM'}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Rubik','Assistant',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#f3f4f6;font-size:1px;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.bgWhite};border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">

          <tr>
            <td style="background:linear-gradient(135deg, ${headerColor} 0%, ${headerColorEnd} 100%);padding:32px 40px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:${headerTitle ? '16' : '0'}px;">
                    <span style="font-size:28px;font-weight:700;color:white;letter-spacing:1px;">Botomat<span style="color:${COLORS.primary};">.</span>CRM</span>
                  </td>
                </tr>
                ${headerTitle ? `
                <tr>
                  <td align="center">
                    <div style="width:40px;height:2px;background:rgba(255,255,255,0.4);margin:0 auto 16px;border-radius:1px;"></div>
                    ${headerIcon ? `<div style="font-size:36px;margin-bottom:8px;">${headerIcon}</div>` : ''}
                    <h1 style="color:white;margin:0;font-size:22px;font-weight:600;line-height:1.4;">${headerTitle}</h1>
                    ${headerSubtitle ? `<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${headerSubtitle}</p>` : ''}
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${COLORS.border};padding-top:24px;text-align:center;">
                    ${footerExtra ? `<div style="margin-bottom:16px;">${footerExtra}</div>` : ''}
                    <p style="color:${COLORS.textMuted};font-size:12px;margin:0 0 8px;">
                      © ${new Date().getFullYear()} Botomat CRM. כל הזכויות שמורות.
                    </p>
                    <p style="margin:0;">
                      <a href="${FRONTEND_URL}" style="color:${COLORS.textLight};font-size:12px;text-decoration:underline;">crm.botomat.co.il</a>
                    </p>
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
</html>`;
}

function ctaButton(text, url, color = '#111827', colorEnd = '#1f2937') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg, ${color} 0%, ${colorEnd} 100%);border-radius:10px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function infoCard(content, bgColor = COLORS.bgLight, borderColor = COLORS.border) {
  return `<div style="background:${bgColor};border-radius:12px;padding:20px;margin:20px 0;border:1px solid ${borderColor};">${content}</div>`;
}

function dataTable(rows) {
  const rowsHtml = rows.map(([label, value, highlight]) => `
    <tr>
      <td style="padding:10px 12px;color:${COLORS.textLight};font-size:14px;white-space:nowrap;">${label}</td>
      <td style="padding:10px 12px;color:${highlight ? COLORS.primaryDark : COLORS.textDark};font-size:14px;font-weight:${highlight ? '600' : '400'};">${value}</td>
    </tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bgLight};border-radius:12px;overflow:hidden;margin:20px 0;">${rowsHtml}</table>`;
}

function alertBox(message, type = 'info') {
  const styles = {
    warning: { bg: COLORS.warningLight, color: COLORS.warning, icon: '⚠️' },
    error: { bg: COLORS.errorLight, color: COLORS.error, icon: '🚨' },
    success: { bg: COLORS.successLight, color: COLORS.success, icon: '✅' },
    info: { bg: COLORS.infoLight, color: COLORS.info, icon: 'ℹ️' },
  };
  const s = styles[type] || styles.info;
  return `<div style="background:${s.bg};border-radius:10px;padding:16px 20px;margin:20px 0;border-right:4px solid ${s.color};">
    <p style="color:${s.color};margin:0;font-size:14px;line-height:1.6;">${s.icon} ${message}</p>
  </div>`;
}

function paragraph(text, options = {}) {
  const { bold, color, size, marginTop } = options;
  return `<p style="color:${color || COLORS.textMedium};font-size:${size || '15'}px;line-height:1.7;margin:${marginTop || '0'} 0 12px;${bold ? 'font-weight:600;' : ''}">${text}</p>`;
}

function greeting(name) {
  return paragraph(`שלום ${name || 'משתמש יקר'},`, { size: '17', bold: true, color: COLORS.textDark });
}

function bigCode(code) {
  return `<div style="background:${COLORS.bgLight};border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:${COLORS.primaryDark};font-family:monospace;">${code}</div>
  </div>`;
}

module.exports = {
  wrapInLayout, ctaButton, infoCard, dataTable, alertBox, paragraph, greeting, bigCode,
  COLORS, APP_URL, FRONTEND_URL,
};
