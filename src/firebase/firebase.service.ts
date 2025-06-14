import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin'
import * as path from 'path'
// import { FirebaseAppError } from 'firebase-admin/app';

@Injectable()
export class FireBaseService {
  private logger = new Logger(FireBaseService.name)
  constructor(
    private readonly configService: ConfigService
  ) {
    // Init firebase sdk
    const serviceAccountPath = path.resolve(
      __dirname,
      this.configService.get('FIREBASE_CONFIG_PATH')!
    )

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    })
  }

  async sendPushNotifications(token: string, title: string, body: string, data?: any) {
    const message = {
      notification: {
        title,
        body 
      },
      data: data || {},
      token
    }
    try {
      const response = await admin.messaging().send(message)
      this.logger.log(`Sucessfully sent message: ${response}`)
    } catch (error) {
      this.logger.log(`Error sent message: ${error}`)
    }
  }
  
  async sendPushNotificationsToMultipleDevices(tokens: string[], title: string, body: string, data?: any) {
    const message = {
      notification: {
        title,
        body 
      },
      data: data || {},
      tokens
    }
    try {
      const response = await admin.messaging().sendEachForMulticast(message)
      this.logger.log(`Sucessfully sent message: ${response.successCount}`)
    } catch (error) {
      this.logger.log(`Error sent message: ${error}`)
    }
  }
}
