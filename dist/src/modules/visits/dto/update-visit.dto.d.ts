import { VisitProductDto, VisitStatus } from './create-visit.dto';
export declare class UpdateVisitDto {
    purpose?: string;
    notes?: string;
    followUpDate?: string;
    followUpNotes?: string;
    followUpDone?: boolean;
    status?: VisitStatus;
    products?: VisitProductDto[];
}
