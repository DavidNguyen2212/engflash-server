import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
} from '@nestjs/terminus';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryHealthIndicator {
    constructor(
        private readonly httpService: HttpService,
        private readonly healthIndicatorService: HealthIndicatorService
    ) { }

    async isHealthy(key: string) {
        const indicator = this.healthIndicatorService.check(key)

        try {
            const result = await cloudinary.api.ping()
            if (result.status === 'ok') {
                return indicator.up()
            } else {
                return indicator.down({ result: result.status });
            }

        } catch (error) {
            return indicator.down('Unable to connect to Cloudinary service')
        }
    }

}