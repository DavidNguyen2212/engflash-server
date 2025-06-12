import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, LessThanOrEqual } from 'typeorm';
import { Card, Topic, UserCardReview } from 'src/cards/entities';
// import { YoutubeTranscript } from 'youtube-transcript';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { User } from 'src/users/entities';
import { OpenAIService } from 'src/shared/services/openai.service';
// import { decode } from 'html-entities';


@Injectable()
export class TopicsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCardReview)
    private reviewRepository: Repository<UserCardReview>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    private configService: ConfigService,
    private openaiService: OpenAIService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async getAllTopicsByUser(user_id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: Number(user_id),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ${user_id} not found!`);
    }

    if (!user.defaultTopicsLoaded) {
      // Get default topics
      const defaultTopics = await this.topicRepository.find({
        where: { is_default: true },
        relations: ['cards'],
      });

      // Cloning by transaction
      await this.dataSource.transaction(async (manager) => {
        user.defaultTopicsLoaded = true;
        await manager.save(user);

        for (const defTopic of defaultTopics) {
          // Tạo bản sao của topic
          const clonedTopic = manager.create(Topic, {
            topic_name: defTopic.topic_name,
            topic_description: defTopic.topic_description,
            is_default: true,
            user: user,
          });
          await manager.save(clonedTopic);

          const defaultCards = await this.cardRepository.find({
            where: {
              user: IsNull(),
              topic: { topic_id: defTopic.topic_id },
            },
          });

          if (defaultCards.length > 0) {
            const clonedCards = defaultCards.map((card) => {
              const { card_id, ...rest } = card;
              return manager.create(Card, {
                ...rest,
                topic: clonedTopic, // gán topic mới
                user: user, // gán user hiện tại
              });
            });
            await manager.save(clonedCards);
          }
        }
      });
    }
    // const topics = await this.topicRepository
    //     .createQueryBuilder('topic')
    //     .leftJoin('topic.cards', 'card')
    //     .where('card.user_id = :user_id', { user_id })
    //     .orderBy('topic.topic_id', 'ASC')
    //     .getMany()
    const topics = await this.topicRepository.find({
      where: { user: { id: Number(user_id) } },
      order: { topic_id: 'ASC' },
      // relations: ['cards'], // nếu cần preload cards
    });

    return { topics };
  }

  async getAllCardsfromTopic(user_id: string, topic_id: number) {
    const topic = await this.topicRepository.findOne({
      where: {
        topic_id: topic_id,
      },
    });

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.topic_id = :topic_id AND card.user_id = :user_id', {
        topic_id,
        user_id,
      })
      .getMany();

    return { cards, topic };
  }

  async createTranscriptFromVideo(url: string) {
    // 1. Extract video ID
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (!match) throw new BadRequestException('Invalid YouTube URL');
    const videoId = match[1];

    const obj = {
      Gpsd20Fee9Y: {
        embedUrl: 'https://www.youtube.com/embed/Gpsd20Fee9Y',
        captionUrl:
          'https://res.cloudinary.com/djjbvhmjf/raw/upload/v1748160576/captions/Gpsd20Fee9Y.vtt',
      },
      'rxUm-2x-2dM': {
        embedUrl: 'https://www.youtube.com/embed/rxUm-2x-2dM',
        captionUrl:
          'https://res.cloudinary.com/djjbvhmjf/raw/upload/v1748160703/captions/rxUm-2x-2dM.vtt',
      },
      '2UkYJTfaT8E': {
        embedUrl: 'https://www.youtube.com/embed/2UkYJTfaT8E',
        captionUrl:
          'https://res.cloudinary.com/djjbvhmjf/raw/upload/v1748160873/captions/2UkYJTfaT8E.vtt',
      },
    };

    // // 2. Fetch the transcript array [{ text, start, duration }]
    // const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })

    // // 3. Build WebVTT content
    // const vttLines = ["WEBVTT\n"]
    // transcript.forEach(({ text, duration, offset }) => {
    //   const startMs = offset * 1000
    //   const endMs = (offset + duration) * 1000
    //   const decoded = decode(decode(text));
    //   const fmt = (ms: number) => new Date(ms).toISOString().substring(11, 23).replace('.', ',')
    //   vttLines.push(
    //     `${fmt(startMs)} --> ${fmt(endMs)}`,
    //     decoded,
    //     ''
    //   )
    // })
    // const vttContent = vttLines.join('\n')

    // // 4. Upload to cloudinary
    // const uploadResult: any = await new Promise((resolve, reject) => {
    //   const uploadStream = cloudinary.uploader.upload_stream(
    //     {
    //       resource_type: 'raw',
    //       public_id: `captions/${videoId}`,
    //       overwrite: true,
    //       format: 'vtt',
    //     },
    //     (error, result) => {
    //       if (error) return reject(error)
    //       resolve(result)
    //     }
    //   )
    //   uploadStream.end(Buffer.from(vttContent, 'utf8'))
    // })

    // return {
    //   embedUrl: `https://www.youtube.com/embed/${videoId}`,
    //   captionUrl: uploadResult.secure_url
    // }
    return obj[videoId];
  }

  async createTopicFromTranscript(
    user_id: string,
    url: string,
    level: string,
    topic_name: string,
  ) {
    const user = await this.userRepository.findOne({
      where: {
        id: Number(user_id),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ${user_id} not found!`);
    }

    let vttContent: string;
    try {
      const response = await axios.get<string>(url, { responseType: 'text' });
      vttContent = response.data;
    } catch (err) {
      console.log(`Failed to fetch VTT from ${url}`, err);
      throw new BadRequestException('Cannot fetch transcript file');
    }

    try {
      const transcriptText = vttContent
        .split('\n')
        .filter((line) => line && !line.includes('-->') && line != 'WEBVTT')
        .join(' ');
      const results = await this.openaiService.makeWordList(
        Number(user_id),
        transcriptText,
        level,
      );
      // Insert into topic, get the new topic id
      // then batch insert to card
      return await this.dataSource.transaction(async (manager) => {
        const topic = manager.create(Topic, {
          topic_name: topic_name,
          topic_description: results.topic_description,
          is_default: false,
          user: user,
        });
        const savedTopic = await manager.save(topic);

        const cardsToSave = results.words.map((w) =>
          manager.create(Card, {
            front_text: w.front_text,
            back_text: w.back_text,
            ipa_pronunciation: w.ipa_pronunciation,
            example: w.example,
            example_meaning: w.example_meaning,
            topic: savedTopic,
            user: { id: Number(user_id) },
          }),
        );
        const savedCards = await manager.save(cardsToSave);
        return {
          topic: savedTopic,
          cards: savedCards,
        };
      });
    } catch (error) {
      let message = 'Unknown Error';
      if (error instanceof Error) message = error.message;
      // we'll proceed, but let's report it
      console.log(message);
    }
  }

  async reviseTopicCards(userId: string, topicId: number) {
    const today = new Date();
    // today.setHours(0, 0, 0, 0); // Để so sánh chính xác đến ngày

    const cardsToReview = await this.reviewRepository.find({
      where: {
        user: { id: Number(userId) },
        card: {
          topic: { topic_id: topicId },
        },
        next_review_date: LessThanOrEqual(today),
      },
      relations: ['card', 'choices'],
    });

    if (!cardsToReview || cardsToReview.length === 0) {
      throw new NotFoundException(
        `No cards to review in topic ${topicId} for user ${userId}`,
      );
    }

    const deck = cardsToReview.map((review) => ({
      card: review.card,
      choices: review.choices.map((c) =>
        Object({ key: c.text, value: c.isCorrect }),
      ), // from DB, no need OpenAI anymore
    }));

    return deck;
  }
}
