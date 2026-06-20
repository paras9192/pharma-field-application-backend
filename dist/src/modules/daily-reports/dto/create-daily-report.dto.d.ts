export declare enum ReportStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED"
}
export declare class CreateDailyReportDto {
    date: string;
    productsDiscussed?: string;
    competitorActivity?: string;
    highlights?: string;
    challenges?: string;
    remarks?: string;
    status?: ReportStatus;
}
