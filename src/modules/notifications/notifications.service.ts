import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type NotificationType =
  | 'PAYMENT_COLLECTED'
  | 'PAYMENT_REMINDER'
  | 'BILL_CREATED'
  | 'VISIT_LOGGED'
  | 'FOLLOW_UP_DUE'
  | 'BILL_OVERDUE'
  | 'GENERAL';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmReady = false;
  private firebaseApp: App | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const projectId   = this.config.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');
    const privateKey  = this.config.get('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials missing — push notifications disabled');
      return;
    }

    try {
      // Normalise the private key: env vars often store actual newlines or escaped \n
      const normalizedKey = privateKey.replace(/\\n/g, '\n').trim();

      if (!getApps().length) {
        this.firebaseApp = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey: normalizedKey }),
        });
      } else {
        this.firebaseApp = getApps()[0];
      }
      this.fcmReady = true;
      this.logger.log('Firebase Admin initialized — push notifications enabled');
    } catch (err: any) {
      this.logger.warn(
        `Firebase init failed (push notifications disabled): ${err.message ?? err.code ?? err}`,
      );
    }
  }

  // ── Core method — call this everywhere ────────────────────────────────────

  async notify(
    userIds: string | string[],
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, any>,
  ): Promise<void> {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (!ids.length) return;

    // Save in-app notifications
    await this.prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, title, body, type, data: data ?? {} })),
    });

    // Send FCM push to all tokens of all users
    if (this.fcmReady) {
      const fcmTokens = await this.prisma.fcmToken.findMany({
        where: { userId: { in: ids } },
        select: { token: true },
      });

      if (fcmTokens.length) {
        const tokens = fcmTokens.map((t) => t.token);
        try {
          await getMessaging(this.firebaseApp!).sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          });
        } catch (err: any) {
          this.logger.error(`FCM send failed: ${err.message}`);
        }
      }
    }
  }

  // ── REST endpoints helpers ─────────────────────────────────────────────────

  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount, page, limit };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: count };
  }

  async saveFcmToken(userId: string, token: string) {
    await this.prisma.fcmToken.upsert({
      where: { token },
      update: { userId },
      create: { userId, token },
    });
    return { message: 'FCM token saved' };
  }

  async removeFcmToken(token: string) {
    await this.prisma.fcmToken.deleteMany({ where: { token } });
    return { message: 'FCM token removed' };
  }

  // ── Helpers for specific events ────────────────────────────────────────────

  async notifyAdmins(title: string, body: string, type: NotificationType, data?: Record<string, any>) {
    const admins = await this.prisma.user.findMany({
      where: { role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } }, isActive: true },
      select: { id: true },
    });
    await this.notify(admins.map((a) => a.id), title, body, type, data);
  }
}
