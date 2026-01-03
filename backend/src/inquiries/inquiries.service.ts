import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}
}

