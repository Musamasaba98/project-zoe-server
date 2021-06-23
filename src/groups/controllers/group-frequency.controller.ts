import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GroupMissingReportsService } from '../services/group-missing-reports.service';
import { GroupSearchDto } from '../dto/group-search.dto';
import { SentryInterceptor } from 'src/utils/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@ApiTags('Groups Report Frequency')
@Controller('api/groups/reportfrequency')
export class GroupReportFrequencyController {
  constructor(private readonly service: GroupMissingReportsService) {}

  @Get()
  async groupReportFreq(@Query() req: GroupSearchDto): Promise<any[]> {
    return this.service.getReportFreq(req);
  }
}
