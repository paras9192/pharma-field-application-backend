import { PrismaService } from '../../prisma/prisma.service';
import { CreateStateDto } from './dto/create-state.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { AssignTerritoryDto } from './dto/assign-territory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TerritoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    createState(dto: CreateStateDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        code: string;
    }>;
    findAllStates(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        code: string;
    }[]>;
    findStateWithDistricts(id: number): Promise<{
        districts: {
            id: number;
            name: string;
            createdAt: Date;
            stateId: number;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        code: string;
    }>;
    createDistrict(dto: CreateDistrictDto): Promise<{
        state: {
            id: number;
            name: string;
            createdAt: Date;
            code: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stateId: number;
    }>;
    findDistrictsByState(stateId?: number): Promise<({
        state: {
            id: number;
            name: string;
            createdAt: Date;
            code: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stateId: number;
    })[]>;
    findDistrictWithCities(id: number): Promise<{
        state: {
            id: number;
            name: string;
            createdAt: Date;
            code: string;
        };
        cities: {
            id: number;
            name: string;
            createdAt: Date;
            districtId: number;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stateId: number;
    }>;
    createCity(dto: CreateCityDto): Promise<{
        district: {
            state: {
                id: number;
                name: string;
                createdAt: Date;
                code: string;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            stateId: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        districtId: number;
    }>;
    findCitiesByDistrict(districtId?: number): Promise<({
        district: {
            state: {
                id: number;
                name: string;
                createdAt: Date;
                code: string;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            stateId: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        districtId: number;
    })[]>;
    createTerritory(dto: CreateTerritoryDto): Promise<{
        city: {
            district: {
                state: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    code: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                stateId: number;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            districtId: number;
        };
    } & {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        cityId: number;
    }>;
    findAllTerritories(query: PaginationDto & {
        cityId?: number;
        isActive?: string;
    }): Promise<{
        data: ({
            city: {
                district: {
                    state: {
                        id: number;
                        name: string;
                        createdAt: Date;
                        code: string;
                    };
                } & {
                    id: number;
                    name: string;
                    createdAt: Date;
                    stateId: number;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            };
        } & {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOneTerritory(id: number): Promise<{
        employeeTerritories: ({
            user: {
                id: string;
                name: string;
                role: {
                    id: number;
                    name: import("@prisma/client").$Enums.RoleName;
                    description: string | null;
                };
                email: string;
            };
        } & {
            id: number;
            territoryId: number;
            userId: string;
            assignedById: string | null;
            assignedAt: Date;
        })[];
        city: {
            district: {
                state: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    code: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                stateId: number;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            districtId: number;
        };
    } & {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        cityId: number;
    }>;
    updateTerritory(id: number, data: Partial<CreateTerritoryDto> & {
        isActive?: boolean;
    }): Promise<{
        city: {
            district: {
                state: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    code: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                stateId: number;
            };
        } & {
            id: number;
            name: string;
            createdAt: Date;
            districtId: number;
        };
    } & {
        id: number;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        cityId: number;
    }>;
    assignTerritory(dto: AssignTerritoryDto, assignedById: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        territory: {
            city: {
                district: {
                    state: {
                        id: number;
                        name: string;
                        createdAt: Date;
                        code: string;
                    };
                } & {
                    id: number;
                    name: string;
                    createdAt: Date;
                    stateId: number;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            };
        } & {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        };
    } & {
        id: number;
        territoryId: number;
        userId: string;
        assignedById: string | null;
        assignedAt: Date;
    }>;
    unassignTerritory(userId: string, territoryId: number): Promise<{
        message: string;
    }>;
    getUserTerritories(userId: string): Promise<({
        territory: {
            city: {
                district: {
                    state: {
                        id: number;
                        name: string;
                        createdAt: Date;
                        code: string;
                    };
                } & {
                    id: number;
                    name: string;
                    createdAt: Date;
                    stateId: number;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            };
        } & {
            id: number;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            cityId: number;
        };
    } & {
        id: number;
        territoryId: number;
        userId: string;
        assignedById: string | null;
        assignedAt: Date;
    })[]>;
    getFullHierarchy(): Promise<({
        districts: ({
            cities: ({
                territories: {
                    id: number;
                    name: string;
                    description: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    code: string | null;
                    cityId: number;
                }[];
            } & {
                id: number;
                name: string;
                createdAt: Date;
                districtId: number;
            })[];
        } & {
            id: number;
            name: string;
            createdAt: Date;
            stateId: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        code: string;
    })[]>;
}
