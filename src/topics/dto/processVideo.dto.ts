import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessVideoDto {
  @ApiProperty({
    description: 'Youtube video url',
    example: 'https://www.youtube.com/watch?v=rxUm-2x-2dM',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class ProcessTranscriptDto {
  @ApiProperty({
    description: 'Caption url',
    example: 'cloudinary url',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Topic level',
    example: 'medium',
  })
  @IsNotEmpty()
  @IsString()
  level: string;

  @ApiProperty({
    description: 'Topic name',
    example: 'Gold digger',
  })
  @IsNotEmpty()
  @IsString()
  topic_name: string;
}
