import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TerritoriesModule } from './modules/territories/territories.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { ChemistsModule } from './modules/chemists/chemists.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { VisitsModule } from './modules/visits/visits.module';
import { DailyReportsModule } from './modules/daily-reports/daily-reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BillsModule } from './modules/bills/bills.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TerritoriesModule,
    DoctorsModule,
    ChemistsModule,
    AttendanceModule,
    VisitsModule,
    DailyReportsModule,
    DashboardModule,
    MailModule,
    OrdersModule,
    BillsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
