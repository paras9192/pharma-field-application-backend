export declare enum VisitType {
    DOCTOR = "DOCTOR",
    CHEMIST = "CHEMIST"
}
export declare enum VisitStatus {
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    PENDING = "PENDING"
}
export declare class VisitProductDto {
    productName: string;
    details?: string;
    quantity?: string;
}
export declare class CreateVisitDto {
    visitType: VisitType;
    doctorId?: string;
    chemistId?: string;
    territoryId?: number;
    visitDate: string;
    lat?: number;
    lng?: number;
    locationAddress?: string;
    purpose?: string;
    notes?: string;
    followUpDate?: string;
    followUpNotes?: string;
    status?: VisitStatus;
    products?: VisitProductDto[];
}
