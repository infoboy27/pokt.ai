import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PathService } from './path.service';
import * as crypto from 'crypto';

@Injectable()
export class EndpointsService {
  constructor(
    private prisma: PrismaService,
    private pathService: PathService,
  ) {}

  async createEndpoint(data: {
    orgId: string;
    name: string;
    chainId: string;
    rateLimit: number;
  }) {
    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Create endpoint in PATH/Shannon
    const pathEndpoint = await this.pathService.provisionEndpoint({
      orgId: data.orgId,
      chainId: data.chainId,
      rateLimit: data.rateLimit,
      label: data.name,
    });

    // Store in database
    const endpoint = await this.prisma.endpoint.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        chainId: data.chainId,
        rateLimit: data.rateLimit,
        tokenHash,
        status: 'active',
      },
    });

    return {
      ...endpoint,
      endpointUrl: pathEndpoint.endpointUrl,
      token, // Only returned once
    };
  }

  async getEndpoints(orgId: string) {
    return this.prisma.endpoint.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEndpoint(id: string, orgId: string) {
    const endpoint = await this.prisma.endpoint.findFirst({
      where: { id, orgId },
    });

    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    return endpoint;
  }

  async rotateToken(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);
    
    // Generate new token
    const newToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newToken).digest('hex');

    // Update in PATH/Shannon
    await this.pathService.rotateToken(id);

    // Update in database
    await this.prisma.endpoint.update({
      where: { id },
      data: { tokenHash: newTokenHash },
    });

    return { token: newToken }; // Only returned once
  }

  async revokeEndpoint(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);

    // Revoke in PATH/Shannon
    await this.pathService.revokeEndpoint(id);

    // Update status in database
    await this.prisma.endpoint.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: 'Endpoint revoked successfully' };
  }

  async deleteEndpoint(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);

    // Revoke in PATH/Shannon
    await this.pathService.revokeEndpoint(id);

    // Delete from database
    await this.prisma.endpoint.delete({
      where: { id },
    });

    return { message: 'Endpoint deleted successfully' };
  }
}
