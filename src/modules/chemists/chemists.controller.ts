import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChemistsService } from './chemists.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Chemists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chemists')
export class ChemistsController {
  constructor(private chemistsService: ChemistsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new chemist/customer' })
  create(@Body() dto: CreateChemistDto, @CurrentUser('id') userId: string) {
    return this.chemistsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List chemists (SALES_PERSON sees only their assigned chemists)' })
  findAll(
    @Query() query: PaginationDto & { territoryId?: number; isActive?: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.chemistsService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chemist details' })
  findOne(@Param('id') id: string) {
    return this.chemistsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update chemist details' })
  update(@Param('id') id: string, @Body() dto: UpdateChemistDto) {
    return this.chemistsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a chemist' })
  remove(@Param('id') id: string) {
    return this.chemistsService.remove(id);
  }
}
