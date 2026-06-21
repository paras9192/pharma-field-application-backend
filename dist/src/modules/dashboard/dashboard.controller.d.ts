import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getAdminDashboard(date?: string): Promise<{
        date: string;
        summary: {
            totalEmployees: number;
            activeEmployees: number;
            presentToday: number;
            absentToday: number;
            totalVisitsToday: number;
            doctorVisitsToday: number;
            chemistVisitsToday: number;
            pendingFollowUps: number;
            reportsSubmittedToday: number;
            totalDoctors: number;
            totalChemists: number;
        };
        topPerformers: {
            user: {
                id: string;
                name: string;
                role: {
                    id: number;
                    name: import("@prisma/client").$Enums.RoleName;
                    description: string | null;
                };
                employeeCode: string | null;
            } | null;
            visitCount: number;
        }[];
        presentEmployees: ({
            user: {
                id: string;
                name: string;
                role: {
                    id: number;
                    name: import("@prisma/client").$Enums.RoleName;
                    description: string | null;
                };
                employeeCode: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            notes: string | null;
            date: Date;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        })[];
    }>;
    getMyDashboard(userId: string, date?: string): Promise<{
        date: string;
        attendance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            notes: string | null;
            date: Date;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        } | null;
        summary: {
            todayVisits: number;
            doctorVisitsToday: number;
            chemistVisitsToday: number;
            pendingFollowUps: number;
            totalVisitsMonth: number;
            reportStatus: string;
        };
        recentVisits: ({
            chemist: {
                id: string;
                shopName: string;
            } | null;
            doctor: {
                id: string;
                name: string;
            } | null;
            products: {
                id: number;
                createdAt: Date;
                productName: string;
                quantity: string | null;
                visitId: string;
                details: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            territoryId: number | null;
            userId: string;
            chemistId: string | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            notes: string | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
            doctorId: string | null;
            visitTime: Date;
            lat: import("@prisma/client-runtime-utils").Decimal | null;
            lng: import("@prisma/client-runtime-utils").Decimal | null;
            locationAddress: string | null;
            purpose: string | null;
            followUpDate: Date | null;
            followUpNotes: string | null;
            followUpDone: boolean;
        })[];
        upcomingFollowUps: ({
            chemist: {
                id: string;
                shopName: string;
            } | null;
            doctor: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            territoryId: number | null;
            userId: string;
            chemistId: string | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            notes: string | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
            doctorId: string | null;
            visitTime: Date;
            lat: import("@prisma/client-runtime-utils").Decimal | null;
            lng: import("@prisma/client-runtime-utils").Decimal | null;
            locationAddress: string | null;
            purpose: string | null;
            followUpDate: Date | null;
            followUpNotes: string | null;
            followUpDone: boolean;
        })[];
    }>;
    getTerritoryStats(): Promise<{
        id: number;
        name: string;
        code: string | null;
        location: {
            city: string;
            district: string;
            state: string;
        };
        assignedEmployees: number;
        employees: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
            };
        }[];
        stats: {
            doctors: number;
            chemists: number;
            totalVisits: number;
        };
    }[]>;
    getEmployeePerformance(from?: string, to?: string): Promise<{
        employee: {
            id: string;
            name: string;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
            };
            employeeCode: string | null;
        };
        totalVisits: number;
        doctorVisits: number;
        chemistVisits: number;
        daysPresent: number;
        reportsSubmitted: number;
    }[]>;
    getSuperAdminDashboard(date?: string): Promise<{
        date: string;
        kpi: {
            totalBills: number;
            totalBillValue: number;
            totalCollected: number;
            totalOutstanding: number;
            overdueCount: number;
            overdueAmount: number;
            billsToday: number;
            billsThisMonth: number;
            totalChemists: number;
            totalDoctors: number;
            totalEmployees: number;
            presentToday: number;
            attendanceRate: number;
            visitsToday: number;
            pendingFollowUps: number;
            collectionRate: number;
        };
        trends: {
            bills: {
                date: string;
                amount: number;
                count: number;
            }[];
            collections: {
                date: string;
                amount: number;
                count: number;
            }[];
        };
        leaderboard: {
            salespersons: {
                rank: number;
                user: {
                    id: string;
                    name: string;
                    employeeCode: string | null;
                } | null;
                collected: number;
                transactions: number;
            }[];
            mrs: {
                rank: number;
                user: {
                    id: string;
                    name: string;
                    role: {
                        id: number;
                        name: import("@prisma/client").$Enums.RoleName;
                        description: string | null;
                    };
                    employeeCode: string | null;
                } | null;
                visitsThisMonth: number;
            }[];
        };
        alerts: {
            overdueCount: number;
            overdueAmount: number;
            pendingFollowUps: number;
            employeesAbsent: number;
        };
        recentActivity: {
            payments: {
                type: "PAYMENT";
                id: string;
                description: string;
                mode: import("@prisma/client").$Enums.PaymentMode;
                amount: number;
                at: Date;
            }[];
            bills: {
                type: "BILL";
                id: string;
                description: string;
                amount: number;
                status: import("@prisma/client").$Enums.BillStatus;
                at: Date;
            }[];
        };
    }>;
    getPaymentDashboard(currentUser: any, month?: string, year?: string, from?: string, to?: string, status?: string, chemistId?: string, collectedById?: string): Promise<{
        period: {
            label: string;
            from: string | null;
            to: string | null;
            month: number | null;
            year: number | null;
        };
        filters: {
            status: string | null;
            chemistId: string | null;
            collectedById: string | null;
        };
        kpi: {
            totalBills: number;
            totalBillValue: number;
            totalCollected: number;
            totalOutstanding: number;
            unpaidCount: number;
            partialCount: number;
            paidCount: number;
            totalTransactions: number;
            collectionRate: number;
        };
        aging: {
            dueToday: {
                count: number;
                amount: number;
            };
            due1to7Days: {
                count: number;
                amount: number;
            };
            due8to15Days: {
                count: number;
                amount: number;
            };
            due16to30Days: {
                count: number;
                amount: number;
            };
            overdue1to30: {
                count: number;
                amount: number;
            };
            overdue30plus: {
                count: number;
                amount: number;
            };
        };
        paymentModes: {
            mode: import("@prisma/client").$Enums.PaymentMode;
            amount: number;
            count: number;
        }[];
        monthlyTrend: {
            month: string;
            label: string;
            billValue: number;
            billCount: number;
            collected: number;
            transactions: number;
            collectionRate: number;
        }[];
        dailyTrend: {
            date: string;
            amount: number;
            count: number;
        }[];
        salespersonRanking: any[];
        upcomingCollections: {
            dueAmount: number;
            daysUntilDue: number;
            id: string;
            createdBy: {
                id: string;
                name: string;
            };
            chemist: {
                id: string;
                phone: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            billNumber: string;
            dueDate: Date | null;
        }[];
        highRiskAccounts: {
            dueAmount: number;
            daysOverdue: number;
            id: string;
            createdBy: {
                id: string;
                name: string;
            };
            chemist: {
                id: string;
                phone: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            billNumber: string;
            dueDate: Date | null;
        }[];
    }>;
    getSalesPersonDashboard(currentUser: any, userId?: string, date?: string): Promise<{
        date: string;
        attendance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            notes: string | null;
            date: Date;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        } | null;
        kpi: {
            totalAssignedChemists: number;
            todayCollected: number;
            todayTransactions: number;
            todayVisits: number;
            pendingBills: number;
            overdueCount: number;
            pendingFollowUps: number;
        };
        monthlyPerformance: {
            billsCreated: number;
            billValue: number;
            collected: number;
            transactions: number;
        };
        collectionTasks: {
            dueAmount: number;
            daysUntilDue: number;
            priority: string;
            id: string;
            chemist: {
                id: string;
                phone: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            billNumber: string;
            dueDate: Date | null;
        }[];
        overdueBills: {
            dueAmount: number;
            daysOverdue: number;
            id: string;
            chemist: {
                id: string;
                phone: string;
                shopName: string;
                ownerName: string;
            };
            status: import("@prisma/client").$Enums.BillStatus;
            billNumber: string;
            dueDate: Date | null;
        }[];
        todaySchedule: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
            } | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            doctor: {
                id: string;
                name: string;
            } | null;
            visitType: import("@prisma/client").$Enums.VisitType;
            visitTime: Date;
            purpose: string | null;
        }[];
        assignedChemists: {
            id: string;
            phone: string;
            shopName: string;
            ownerName: string;
        }[];
    }>;
    getMRDashboard(currentUser: any, userId?: string, date?: string): Promise<{
        date: string;
        attendance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            notes: string | null;
            date: Date;
            checkInTime: Date | null;
            checkInLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkInLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkInAddress: string | null;
            checkOutTime: Date | null;
            checkOutLat: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutLng: import("@prisma/client-runtime-utils").Decimal | null;
            checkOutAddress: string | null;
            workingHours: import("@prisma/client-runtime-utils").Decimal | null;
        } | null;
        kpi: {
            todayVisits: number;
            completedVisitsToday: number;
            pendingFollowUps: number;
            totalVisitsThisMonth: number;
            avgVisitsPerDay: number;
            reportStatus: string;
        };
        monthlyBreakdown: {
            totalVisits: number;
            doctorVisits: number;
            chemistVisits: number;
            completionRate: number;
        };
        todaySchedule: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
            } | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            notes: string | null;
            doctor: {
                id: string;
                name: string;
                specialization: string | null;
                clinicName: string | null;
            } | null;
            products: {
                id: number;
                createdAt: Date;
                productName: string;
                quantity: string | null;
                visitId: string;
                details: string | null;
            }[];
            visitType: import("@prisma/client").$Enums.VisitType;
            visitTime: Date;
            purpose: string | null;
        }[];
        upcomingFollowUps: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
            } | null;
            doctor: {
                id: string;
                name: string;
                specialization: string | null;
                clinicName: string | null;
            } | null;
            visitType: import("@prisma/client").$Enums.VisitType;
            followUpDate: Date | null;
            followUpNotes: string | null;
        }[];
        recentActivity: {
            id: string;
            chemist: {
                id: string;
                shopName: string;
            } | null;
            status: import("@prisma/client").$Enums.VisitStatus;
            doctor: {
                id: string;
                name: string;
            } | null;
            visitDate: Date;
            visitType: import("@prisma/client").$Enums.VisitType;
        }[];
    }>;
    getAlerts(currentUser: any): Promise<{
        alerts: {
            type: string;
            severity: "HIGH" | "MEDIUM" | "LOW";
            message: string;
            count?: number;
        }[];
        count: number;
        generatedAt: Date;
    }>;
}
