import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GoogleMeetService } from './google-meet.service';

@ApiTags('google-meet')
@Controller('google-meet')
export class GoogleMeetController {
  constructor(private readonly googleMeetService: GoogleMeetService) {}
}

