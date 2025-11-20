
export const sendEmail = async (to: string, subject: string, body: string) => {
    // In a real application, this would use nodemailer or a service like SendGrid/AWS SES.
    // For this local implementation, we log to the console to simulate sending.
    console.log('--- 📧 EMAIL NOTIFICATION 📧 ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}`);
    console.log('--------------------------------');
};
