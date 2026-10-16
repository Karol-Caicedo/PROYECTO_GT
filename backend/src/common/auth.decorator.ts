import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles, AppRole } from './roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

export function Auth(...roles: AppRole[]) {
  return applyDecorators(
    ApiBearerAuth(),
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
