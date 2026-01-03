import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}
}

