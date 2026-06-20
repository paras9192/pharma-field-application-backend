import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';
import { CreateStateDto } from './dto/create-state.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { AssignTerritoryDto } from './dto/assign-territory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Territories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('territories')
export class TerritoriesController {
  constructor(private territoriesService: TerritoriesService) {}

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get full State > District > City > Territory hierarchy' })
  getFullHierarchy() {
    return this.territoriesService.getFullHierarchy();
  }

  // ─── States ───────────────────────────────────────────────────────────────

  @Post('states')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a state' })
  createState(@Body() dto: CreateStateDto) {
    return this.territoriesService.createState(dto);
  }

  @Get('states')
  @ApiOperation({ summary: 'List all states' })
  findAllStates() {
    return this.territoriesService.findAllStates();
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get state with its districts' })
  findStateWithDistricts(@Param('id', ParseIntPipe) id: number) {
    return this.territoriesService.findStateWithDistricts(id);
  }

  // ─── Districts ────────────────────────────────────────────────────────────

  @Post('districts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a district' })
  createDistrict(@Body() dto: CreateDistrictDto) {
    return this.territoriesService.createDistrict(dto);
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts by state' })
  findDistrictsByState(@Query('stateId', new ParseIntPipe({ optional: true })) stateId?: number) {
    return this.territoriesService.findDistrictsByState(stateId);
  }

  @Get('districts/:id')
  @ApiOperation({ summary: 'Get district with its cities' })
  findDistrictWithCities(@Param('id', ParseIntPipe) id: number) {
    return this.territoriesService.findDistrictWithCities(id);
  }

  // ─── Cities ───────────────────────────────────────────────────────────────

  @Post('cities')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a city' })
  createCity(@Body() dto: CreateCityDto) {
    return this.territoriesService.createCity(dto);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities by district' })
  findCitiesByDistrict(@Query('districtId', new ParseIntPipe({ optional: true })) districtId?: number) {
    return this.territoriesService.findCitiesByDistrict(districtId);
  }

  // ─── Territories ──────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a territory' })
  createTerritory(@Body() dto: CreateTerritoryDto) {
    return this.territoriesService.createTerritory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all territories' })
  findAllTerritories(@Query() query: PaginationDto & { cityId?: number; isActive?: string }) {
    return this.territoriesService.findAllTerritories(query);
  }

  // ─── Employee Assignments ─────────────────────────────────────────────────

  @Post('assign')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Assign territory to an employee' })
  assignTerritory(@Body() dto: AssignTerritoryDto, @CurrentUser('id') currentUserId: string) {
    return this.territoriesService.assignTerritory(dto, currentUserId);
  }

  @Delete('assign/:userId/:territoryId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Unassign territory from an employee' })
  unassignTerritory(
    @Param('userId') userId: string,
    @Param('territoryId', ParseIntPipe) territoryId: number,
  ) {
    return this.territoriesService.unassignTerritory(userId, territoryId);
  }

  @Get('user/:userId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get territories assigned to a user' })
  getUserTerritories(@Param('userId') userId: string) {
    return this.territoriesService.getUserTerritories(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get territory details with assigned employees' })
  findOneTerritory(@Param('id', ParseIntPipe) id: number) {
    return this.territoriesService.findOneTerritory(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update territory' })
  updateTerritory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreateTerritoryDto> & { isActive?: boolean },
  ) {
    return this.territoriesService.updateTerritory(id, data);
  }
}
