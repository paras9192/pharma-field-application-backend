import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT') ?? 587),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  private async getSuperAdminEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: { name: 'SUPER_ADMIN' }, isActive: true },
      select: { email: true },
    });
    return admins.map((a) => a.email);
  }

  private send(to: string[], subject: string, html: string): void {
    const from = `"${this.config.get('APP_NAME') ?? 'PharmaField'}" <${this.config.get('SMTP_FROM') ?? this.config.get('SMTP_USER')}>`;
    this.transporter
      .sendMail({ from, to, subject, html })
      .then(() => this.logger.log(`Mail sent → ${to.join(', ')} | ${subject}`))
      .catch((err) => this.logger.error(`Mail failed: ${err.message}`));
  }

  sendWelcomeEmail(user: { name: string; email: string; employeeCode?: string | null }, token: string): void {
    const appName = this.config.get('APP_NAME') ?? 'PharmaField';
    const appUrl = this.config.get('APP_URL') ?? 'http://localhost:5173';
    const link = `${appUrl}/set-password?token=${token}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1e293b">
        <div style="background:#1d4ed8;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px">Hi <strong>${user.name}</strong>,</p>
          <p>Welcome to <strong>${appName}</strong>! Your account has been created by an administrator.</p>
          ${user.employeeCode ? `<p>Your Employee Code: <strong>${user.employeeCode}</strong></p>` : ''}
          <p>Please set your password by clicking the button below. This link is valid for <strong>24 hours</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">Set My Password</a>
          </div>
          <p style="font-size:13px;color:#64748b">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size:12px;color:#3b82f6;word-break:break-all">${link}</p>
          <p style="font-size:13px;color:#64748b;margin-top:24px">If you did not expect this email, please ignore it or contact your administrator.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:12px">This is an automated message from ${appName}. Please do not reply.</p>
      </div>`;

    this.send([user.email], `Welcome to ${appName} — Set Your Password`, html);
  }

  async notifyDailyReport(report: {
    id: string;
    date: Date;
    status: string;
    totalVisits: number;
    doctorVisits: number;
    chemistVisits: number;
    highlights?: string | null;
    challenges?: string | null;
    remarks?: string | null;
    user: { name: string };
  }): Promise<void> {
    const recipients = await this.getSuperAdminEmails();
    if (!recipients.length) return;

    const dateStr = report.date.toDateString();
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1d4ed8">Daily Report ${report.status === 'SUBMITTED' ? 'Submitted' : 'Created'}</h2>
        <p><strong>${report.user.name}</strong> has ${report.status === 'SUBMITTED' ? 'submitted' : 'created'} a daily report for <strong>${dateStr}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr style="background:#f1f5f9">
            <td style="padding:8px;border:1px solid #e2e8f0">Total Visits</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${report.totalVisits}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e2e8f0">Doctor Visits</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${report.doctorVisits}</td>
          </tr>
          <tr style="background:#f1f5f9">
            <td style="padding:8px;border:1px solid #e2e8f0">Chemist Visits</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${report.chemistVisits}</td>
          </tr>
          ${report.highlights ? `<tr><td style="padding:8px;border:1px solid #e2e8f0">Highlights</td><td style="padding:8px;border:1px solid #e2e8f0">${report.highlights}</td></tr>` : ''}
          ${report.challenges ? `<tr style="background:#f1f5f9"><td style="padding:8px;border:1px solid #e2e8f0">Challenges</td><td style="padding:8px;border:1px solid #e2e8f0">${report.challenges}</td></tr>` : ''}
          ${report.remarks ? `<tr><td style="padding:8px;border:1px solid #e2e8f0">Remarks</td><td style="padding:8px;border:1px solid #e2e8f0">${report.remarks}</td></tr>` : ''}
        </table>
        <p style="color:#64748b;font-size:12px;margin-top:16px">PharmaField Workforce Management</p>
      </div>`;

    this.send(
      recipients,
      `Daily Report ${report.status === 'SUBMITTED' ? 'Submitted' : 'Created'} — ${report.user.name} (${dateStr})`,
      html,
    );
  }

  async notifyVisit(visit: {
    id: string;
    visitType: string;
    visitDate: Date;
    purpose?: string | null;
    notes?: string | null;
    user: { name: string; employeeCode?: string | null };
    doctor?: { name: string; specialization?: string | null; email?: string | null; clinicName?: string | null } | null;
    chemist?: { shopName: string; ownerName?: string | null } | null;
    territory?: { name: string } | null;
  }): Promise<void> {
    const recipients = await this.getSuperAdminEmails();
    if (!recipients.length) return;

    const target =
      visit.visitType === 'DOCTOR'
        ? `Dr. ${visit.doctor?.name ?? '—'} (${visit.doctor?.specialization ?? ''})`
        : `${visit.chemist?.shopName ?? '—'} — ${visit.chemist?.ownerName ?? ''}`;

    const dateStr = visit.visitDate.toDateString();
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1d4ed8">New Visit Logged</h2>
        <p><strong>${visit.user.name}</strong> (${visit.user.employeeCode ?? ''}) logged a new <strong>${visit.visitType}</strong> visit.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr style="background:#f1f5f9">
            <td style="padding:8px;border:1px solid #e2e8f0">Date</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e2e8f0">Type</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${visit.visitType}</td>
          </tr>
          <tr style="background:#f1f5f9">
            <td style="padding:8px;border:1px solid #e2e8f0">${visit.visitType === 'DOCTOR' ? 'Doctor' : 'Chemist'}</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${target}</td>
          </tr>
          ${visit.territory ? `<tr><td style="padding:8px;border:1px solid #e2e8f0">Territory</td><td style="padding:8px;border:1px solid #e2e8f0">${visit.territory.name}</td></tr>` : ''}
          ${visit.purpose ? `<tr style="background:#f1f5f9"><td style="padding:8px;border:1px solid #e2e8f0">Purpose</td><td style="padding:8px;border:1px solid #e2e8f0">${visit.purpose}</td></tr>` : ''}
          ${visit.notes ? `<tr><td style="padding:8px;border:1px solid #e2e8f0">Notes</td><td style="padding:8px;border:1px solid #e2e8f0">${visit.notes}</td></tr>` : ''}
        </table>
        <p style="color:#64748b;font-size:12px;margin-top:16px">PharmaField Workforce Management</p>
      </div>`;

    this.send(recipients, `New ${visit.visitType} Visit — ${visit.user.name} (${dateStr})`, html);
  }

  async notifyDoctor(visit: {
    visitDate: Date;
    notes?: string | null;
    products: { productName: string; details?: string | null; quantity?: string | null }[];
    user: { name: string };
    doctor?: { name: string; email: string | null; specialization?: string | null; clinicName?: string | null } | null;
  }): Promise<void> {
    if (!visit.doctor?.email) return;
    const doctor = visit.doctor;
    const appName = this.config.get('APP_NAME') ?? 'PharmaField';
    const dateStr = visit.visitDate.toDateString();

    const productRows = visit.products.length
      ? visit.products
          .map(
            (p, i) => `
          <tr style="${i % 2 === 0 ? 'background:#f8fafc' : ''}">
            <td style="padding:8px;border:1px solid #e2e8f0">${p.productName}</td>
            <td style="padding:8px;border:1px solid #e2e8f0">${p.details ?? '—'}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:center">${p.quantity ?? '—'}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="3" style="padding:8px;border:1px solid #e2e8f0;color:#64748b">No products discussed</td></tr>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1e293b">
        <div style="background:#1d4ed8;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px">Dear Dr. ${doctor.name}${doctor.specialization ? ` (${doctor.specialization})` : ''},</p>
          <p>Thank you for taking the time to meet with our representative <strong>${visit.user.name}</strong> on <strong>${dateStr}</strong>. We truly appreciate the opportunity to connect with you.</p>
          <p>During the visit, the following products were presented for your reference:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#1d4ed8;color:#fff">
                <th style="padding:10px 8px;text-align:left;border:1px solid #1d4ed8">Product</th>
                <th style="padding:10px 8px;text-align:left;border:1px solid #1d4ed8">Details</th>
                <th style="padding:10px 8px;text-align:center;border:1px solid #1d4ed8">Qty / Sample</th>
              </tr>
            </thead>
            <tbody>${productRows}</tbody>
          </table>
          ${visit.notes ? `<p style="background:#f1f5f9;padding:12px 16px;border-left:4px solid #1d4ed8;border-radius:4px;margin:16px 0">${visit.notes}</p>` : ''}
          <p>We hope our products meet the needs of your patients. Please feel free to reach out if you have any questions or would like additional information.</p>
          <p>Warm regards,<br/><strong>${visit.user.name}</strong><br/>${appName} Team</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:12px">This is an automated message from ${appName}. Please do not reply to this email.</p>
      </div>`;

    this.send([doctor.email!], `Thank you for meeting with us — ${appName}`, html);
  }
}
