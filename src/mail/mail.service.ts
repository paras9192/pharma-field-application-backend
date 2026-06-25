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

  sendPasswordResetEmail(user: { name: string; email: string }, token: string, requestedBy: string): void {
    const appName = this.config.get('APP_NAME') ?? 'PharmaField';
    const appUrl = this.config.get('APP_URL') ?? 'http://localhost:5173';
    const link = `${appUrl}/set-password?token=${token}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1e293b">
        <div style="background:#dc2626;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
          <p style="color:#fecaca;margin:4px 0 0;font-size:13px">Password Reset</p>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px">Hi <strong>${user.name}</strong>,</p>
          <p>Your password has been reset by <strong>${requestedBy}</strong>. Please set a new password by clicking the button below.</p>
          <p>This link is valid for <strong>24 hours</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">Reset My Password</a>
          </div>
          <p style="font-size:13px;color:#64748b">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size:12px;color:#3b82f6;word-break:break-all">${link}</p>
          <p style="font-size:13px;color:#64748b;margin-top:24px">If you did not request this, please contact your administrator immediately.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:12px">This is an automated message from ${appName}. Please do not reply.</p>
      </div>`;

    this.send([user.email], `Password Reset — ${appName}`, html);
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

  async notifyPaymentReminder(data: {
    chemist: { shopName: string; ownerName: string; email: string | null; phone: string };
    bills: { billNumber: string; totalAmount: any; paidAmount: any; dueAmount: any; status: string; dueDate: Date | null }[];
    sentBy: string;
  }): Promise<void> {
    const appName = this.config.get('APP_NAME') ?? 'PharmaField';
    const fmt = (n: any) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const totalDue = data.bills.reduce((s, b) => s + Number(b.dueAmount), 0);

    const billRows = data.bills.map((b, i) => {
      const isOverdue = b.dueDate && new Date(b.dueDate) < new Date();
      const dueDateStr = b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      return `
        <tr style="${i % 2 === 0 ? 'background:#f8fafc' : ''}">
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${b.billNumber}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right">${fmt(b.totalAmount)}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;color:#16a34a">${fmt(b.paidAmount)}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:${isOverdue ? '#dc2626' : '#d97706'}">${fmt(b.dueAmount)}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:center">
            <span style="background:${isOverdue ? '#fee2e2' : '#fef9c3'};color:${isOverdue ? '#dc2626' : '#92400e'};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">
              ${isOverdue ? '⚠ OVERDUE' : dueDateStr}
            </span>
          </td>
        </tr>`;
    }).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#1e293b">
        <div style="background:#1d4ed8;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Payment Reminder</p>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px">Dear <strong>${data.chemist.ownerName}</strong>,</p>
          <p>This is a friendly reminder from <strong>${appName}</strong> regarding outstanding payment(s) on your account for <strong>${data.chemist.shopName}</strong>.</p>

          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
            <p style="margin:0;font-size:13px;color:#92400e">Total Outstanding Amount</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#d97706">${fmt(totalDue)}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#1d4ed8;color:#fff">
                <th style="padding:10px 12px;text-align:left;border:1px solid #1d4ed8">Bill No.</th>
                <th style="padding:10px 12px;text-align:right;border:1px solid #1d4ed8">Bill Total</th>
                <th style="padding:10px 12px;text-align:right;border:1px solid #1d4ed8">Paid</th>
                <th style="padding:10px 12px;text-align:right;border:1px solid #1d4ed8">Balance Due</th>
                <th style="padding:10px 12px;text-align:center;border:1px solid #1d4ed8">Due Date</th>
              </tr>
            </thead>
            <tbody>${billRows}</tbody>
          </table>

          <p>We request you to kindly arrange the payment at the earliest. If you have already made the payment, please ignore this reminder.</p>
          <p>For any queries, please contact us at <strong>${this.config.get('SMTP_USER') ?? ''}</strong>.</p>
          <p style="margin-top:24px">Regards,<br/><strong>${data.sentBy}</strong><br/>${appName} Team</p>
          <p style="font-size:11px;color:#94a3b8;margin-top:16px">This is an automated reminder sent on behalf of ${appName}.</p>
        </div>
      </div>`;

    this.send([data.chemist.email!], `Payment Reminder — ₹${Number(totalDue).toLocaleString('en-IN')} outstanding | ${data.chemist.shopName}`, html);
  }

  async notifyPaymentCollected(data: {
    billNumber: string;
    chemistName: string;
    chemistEmail: string | null;
    collectedBy: string;
    paymentMode: string;
    amountCollected: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    billStatus: string;
    referenceNumber?: string | null;
    notes?: string | null;
    collectedAt: Date;
  }): Promise<void> {
    const superAdminEmails = await this.getSuperAdminEmails();
    const recipients = [...superAdminEmails];
    if (data.chemistEmail) recipients.push(data.chemistEmail);
    if (!recipients.length) return;

    const appName = this.config.get('APP_NAME') ?? 'PharmaField';
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const isCleared = data.billStatus === 'PAID';
    const statusColor = isCleared ? '#16a34a' : '#d97706';
    const statusLabel = isCleared ? 'FULLY PAID' : 'PARTIAL';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1e293b">
        <div style="background:#1d4ed8;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Payment Notification</p>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 4px;font-size:18px;color:#1e293b">
            ${isCleared ? '🎉 Bill Fully Cleared!' : '💰 Payment Received'}
          </h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:14px">
            ${data.collectedAt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr style="background:#f8fafc">
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;width:40%">Bill Number</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.billNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Chemist / Party</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.chemistName}</td>
            </tr>
            <tr style="background:#f8fafc">
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Collected By</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.collectedBy}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Payment Mode</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.paymentMode}</td>
            </tr>
            ${data.referenceNumber ? `
            <tr style="background:#f8fafc">
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Reference No.</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.referenceNumber}</td>
            </tr>` : ''}
            ${data.notes ? `
            <tr>
              <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600">Notes</td>
              <td style="padding:10px 14px;border:1px solid #e2e8f0">${data.notes}</td>
            </tr>` : ''}
          </table>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#1d4ed8;color:#fff">
                <th style="padding:10px 14px;text-align:left;border:1px solid #1d4ed8">Description</th>
                <th style="padding:10px 14px;text-align:right;border:1px solid #1d4ed8">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#f8fafc">
                <td style="padding:10px 14px;border:1px solid #e2e8f0">Bill Total</td>
                <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right">${fmt(data.totalAmount)}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#16a34a;font-weight:600">This Payment</td>
                <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;color:#16a34a;font-weight:600">+ ${fmt(data.amountCollected)}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:10px 14px;border:1px solid #e2e8f0">Total Paid</td>
                <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right">${fmt(data.paidAmount)}</td>
              </tr>
              <tr style="${isCleared ? 'background:#dcfce7' : 'background:#fef9c3'}">
                <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:700">Balance Due</td>
                <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:${statusColor}">${fmt(data.dueAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align:center;margin-bottom:24px">
            <span style="background:${statusColor};color:#fff;padding:6px 20px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:0.5px">
              ${statusLabel}
            </span>
          </div>

          ${isCleared ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
            <p style="margin:0;color:#15803d;font-weight:600">✅ This bill has been fully settled. No further payment is due.</p>
          </div>` : ''}

          <p style="color:#64748b;font-size:12px;margin-top:8px">This is an automated notification from ${appName}.</p>
        </div>
      </div>`;

    const subject = isCleared
      ? `✅ Bill Cleared — ${data.billNumber} | ${data.chemistName}`
      : `💰 Payment Received — ${data.billNumber} | ${fmt(data.amountCollected)} collected`;

    this.send(recipients, subject, html);
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
