import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly service: SimulationsService) {}

  @Post()
  create(@Body() dto: CreateSimulationDto) {
    return this.service.create(dto);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@Body() dto: CreateSimulationDto) {
    return this.service.preview(dto);
  }

  @Get()
  findRecent(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.service.findRecent(limit ?? 50);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
