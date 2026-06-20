import { Role } from '../../../common/enums/role.enum';
export declare class CreateUserDto {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
    employeeCode?: string;
    dateOfJoining?: string;
}
