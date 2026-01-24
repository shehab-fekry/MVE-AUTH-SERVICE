import ejs from 'ejs';
import path from 'path';
import { InternalServerError } from '../../errors/index.js';
import { transporter } from '../../../libs/nodemailer.js';

export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>
) => {
  // access the template file path
  const filePath = path.join(
    process.cwd(),
    'src',
    'utils',
    'templates',
    `${templateName}.ejs`
  );
  // render the template with data
  const html = await ejs.renderFile(filePath, data);
  return html;
};

export const sendEmail = async (
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>
) => {
  try {
    const html = await renderEmailTemplate(template, data);

    const res = await transporter.sendMail({
      from: `${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    });
    console.log('🚀 ~ sendEmail ~ res:', res);
  } catch (err) {
    console.error('Error sending email:', err);
    throw new InternalServerError();
  }
};
