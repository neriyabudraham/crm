const {
  wrapInLayout, ctaButton, infoCard, dataTable, alertBox,
  paragraph, greeting, bigCode, COLORS, FRONTEND_URL,
} = require('./emailLayout.service');

/**
 * Password reset code email
 */
const passwordResetEmail = (code, link) => {
  const content = `
    ${greeting()}
    ${paragraph('קיבלנו בקשה לאיפוס הסיסמה שלך ב-Botomat CRM. הנה קוד האיפוס:')}
    ${bigCode(code)}
    ${paragraph('או לחץ על הכפתור כדי לפתוח את דף איפוס הסיסמה:')}
    ${ctaButton('אפס סיסמה', link)}
    ${alertBox('הקוד תקף לשעה אחת בלבד. אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.', 'warning')}
  `;
  return wrapInLayout({
    content,
    headerTitle: 'איפוס סיסמה',
    headerIcon: '🔑',
    preheader: `קוד האיפוס שלך: ${code}`,
  });
};

/**
 * Welcome email after signup
 */
const welcomeEmail = (userName) => {
  const content = `
    ${greeting(userName)}
    ${paragraph('ברוך הבא ל-Botomat CRM! החשבון שלך נוצר בהצלחה.')}
    ${infoCard(`
      <h3 style="margin:0 0 12px;color:${COLORS.textDark};font-size:16px;">צעדים ראשונים:</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:${COLORS.textMedium};font-size:14px;">
          <span style="color:${COLORS.primaryDark};margin-left:8px;">①</span> הוסף את הלקוחות הראשונים שלך
        </td></tr>
        <tr><td style="padding:6px 0;color:${COLORS.textMedium};font-size:14px;">
          <span style="color:${COLORS.primaryDark};margin-left:8px;">②</span> צור שאלון או תבנית חתימה
        </td></tr>
        <tr><td style="padding:6px 0;color:${COLORS.textMedium};font-size:14px;">
          <span style="color:${COLORS.primaryDark};margin-left:8px;">③</span> הזמן את הצוות שלך מהגדרות → חברי חשבון
        </td></tr>
      </table>
    `)}
    ${ctaButton('כניסה לחשבון', FRONTEND_URL)}
  `;
  return wrapInLayout({
    content,
    headerTitle: 'ברוך הבא!',
    headerIcon: '🎉',
    preheader: 'החשבון שלך ב-Botomat CRM מוכן לשימוש',
  });
};

/**
 * Member invitation email
 */
const memberInviteEmail = ({ inviterName, accountName, role, isExistingUser }) => {
  const roleHe = role === 'admin' ? 'מנהל' : 'חבר';
  const content = `
    ${greeting()}
    ${paragraph(`<strong>${inviterName}</strong> הזמין/ה אותך להצטרף לחשבון <strong>${accountName}</strong> ב-Botomat CRM כ${roleHe}.`)}

    ${dataTable([
      ['חשבון:', accountName, true],
      ['תפקיד:', roleHe],
      ['הוזמנת על ידי:', inviterName],
    ])}

    ${isExistingUser
      ? paragraph('יש לך כבר חשבון ב-Botomat CRM. פשוט תתחבר בדרך הרגילה ותראה את החשבון החדש בתפריט החלפת חשבונות בראש המסך.')
      : paragraph('עדיין אין לך חשבון? להצטרפות פשוט הירשם עם המייל הזה והגישה תינתן אוטומטית.')
    }

    ${ctaButton(isExistingUser ? 'כניסה לחשבון' : 'הרשמה ל-Botomat CRM', FRONTEND_URL)}
  `;
  return wrapInLayout({
    content,
    headerTitle: 'הזמנה לחשבון',
    headerIcon: '👥',
    preheader: `${inviterName} הזמין/ה אותך ל-${accountName}`,
  });
};

/**
 * Notification email when a client signs a document
 */
const documentSignedEmail = ({ clientName, templateName, downloadUrl }) => {
  const content = `
    ${greeting()}
    ${paragraph(`<strong>${clientName}</strong> חתם/ה על המסמך "<strong>${templateName}</strong>".`)}
    ${ctaButton('צפייה במסמך החתום', downloadUrl)}
    ${alertBox('המסמך זמין גם בכרטיס הלקוח במערכת.', 'success')}
  `;
  return wrapInLayout({
    content,
    headerTitle: 'מסמך חדש נחתם',
    headerIcon: '✍️',
    preheader: `${clientName} חתמ/ה על ${templateName}`,
  });
};

/**
 * Notification email when a client submits a questionnaire
 */
const questionnaireSubmittedEmail = ({ clientName, questionnaireName, link }) => {
  const content = `
    ${greeting()}
    ${paragraph(`<strong>${clientName}</strong> מילא/ה את השאלון "<strong>${questionnaireName}</strong>".`)}
    ${ctaButton('צפייה בכרטיס הלקוח', link)}
  `;
  return wrapInLayout({
    content,
    headerTitle: 'שאלון חדש מולא',
    headerIcon: '📋',
    preheader: `${clientName} מילא/ה את ${questionnaireName}`,
  });
};

module.exports = {
  passwordResetEmail,
  welcomeEmail,
  memberInviteEmail,
  documentSignedEmail,
  questionnaireSubmittedEmail,
};
