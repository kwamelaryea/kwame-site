import { type NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Helper function to verify reCAPTCHA
async function verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY environment variable not set.');
        return false;
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    try {
        const response = await fetch(verificationUrl, { method: 'POST' });
        const data = await response.json();
        console.log('reCAPTCHA verification response:', data);
        return data.success;
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
    }
}


export async function POST(request: NextRequest) {
    const { name, email, message, 'g-recaptcha-response': recaptchaToken } = await request.json();

    // Basic validation
    if (!name || !email || !message) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!recaptchaToken) {
         return NextResponse.json({ message: 'Missing reCAPTCHA token' }, { status: 400 });
    }

    // Verify reCAPTCHA token
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
        return NextResponse.json({ message: 'Invalid reCAPTCHA token' }, { status: 400 });
    }


    // Configure Nodemailer transporter using environment variables
    // IMPORTANT: Use an App Password for Gmail, not your regular password
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD, // Use App Password
        },
    });

    // Email options
    const mailOptions = {
        from: process.env.GMAIL_EMAIL, // Sender address (your Gmail)
        to: process.env.GMAIL_EMAIL,   // Receiver address (your Gmail)
        replyTo: email,               // Set reply-to to the user's email
        subject: `New Contact Form Submission from ${name}`,
        text: `You have received a new message from your contact form:

Name: ${name}
Email: ${email}
Message:
${message}`,
        html: `<p>You have received a new message from your contact form:</p>
               <ul>
                 <li><strong>Name:</strong> ${name}</li>
                 <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
               </ul>
               <p><strong>Message:</strong></p>
               <p>${message.replace(/\n/g, '<br>')}</p>`,
    };

    try {
        console.log('Attempting to send email...');
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        // Log more details if available
        if (error instanceof Error) {
             console.error('Error details:', error.message, error.stack);
        }
        return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
    }
} 