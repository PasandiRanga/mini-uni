import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleMeetService {
  async generateMeetLink(bookingId: string): Promise<string> {
    // TODO: Implement Google Meet API integration
    // This will generate a Google Meet link for the booking
    return `https://meet.google.com/${bookingId}`;
  }
}

