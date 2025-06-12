import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createMultipleChoice(
    word: string,
    correctMeaning: string,
  ): Promise<string[]> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const prompt = `
  Bạn là một trợ lý học tiếng Anh. Tôi cần bạn tạo câu hỏi trắc nghiệm để học từ vựng.
  
  Từ: "${word}"
  Nghĩa đúng: "${correctMeaning}"
  
  Hãy tạo ra **3 đáp án nghĩa tiếng Việt**, trong đó có **1 đáp án đúng**, 2 đáp án sai. Tất cả đáp án nên viết hoa chữ cái đầu. Trả lời kết quả dưới dạng JSON thuần, không giải thích gì thêm, đúng format sau:
  
  {
    "choices": ["Nghĩa đúng", "Nghĩa sai 1", "Nghĩa sai 2"]
  }
  
  Hãy **đảo thứ tự ngẫu nhiên** các đáp án.
  
  **Không trả về giải thích, markdown, triple backticks.**
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Bạn là một trợ lý học từ vựng tiếng Anh.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content || '{}');
      if (!parsed.choices || !Array.isArray(parsed.choices)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return parsed.choices;
    } catch (err) {
      console.error('Error creating multiple choices:', err);
      // Fallback
      return [correctMeaning, 'Dummy 1', 'Dummy 2'];
    }
  }

  async makeWordList(user_id: number, script: string, level: string) {
    const prompt = `
Bạn là một trợ lý học tiếng Anh. Với đoạn script sau: 
<Script>
${script}
</Script>
Tôi cần bạn trích xuất ra những từ có cấp độ ${level}. Hãy trả về kết quả ở định dạng JSON (không giải thích gì thêm):
{
  topic: "..." // tên topic mà bạn đề xuất,
  topic_description: "..." // mô tả cho topic này,
  words: [
    {
      front_text: 'shut up',
      back_text: 'im lặng',
      ipa_pronunciation: '/ʃʌt ʌp/',
      example: 'Shut up and listen!',
      example_meaning: 'Im lặng và nghe đi!',
    },
    {
      front_text: 'silent',
      back_text: 'im lặng',
      ipa_pronunciation: '/ˈsaɪlənt/',
      example: 'Keep silent during the movie.',
      example_meaning: 'Giữ im lặng trong khi xem phim.',
    },
  ], // Là một list của các object từ, mỗi object gồm các trường cho một flashcard, gồm frontext (từ), back_text (nghĩa tiếng Việt của từ), ipa_pronunciation (phát âm ipa), example (ví dụ tiếng Anh cho từ), example_meaning (nghĩa tiếng Việt của ví dụ)
}
  Tránh trả về triple backticks.
    `;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    try {
      const content = response.choices[0].message.content;
      const data = JSON.parse(content ?? '');
      return data;
    } catch (err) {
      console.error('Error generating json content:', err);
    }
  }

  async getMeaning(word: string, correctMeaning: string) {
    const prompt = `
Bạn là một trợ lý học tiếng Anh. Với từ/cụm từ sau: "${word}", nghĩa tiếng Việt của nó: "${correctMeaning}", hãy trả về kết quả ở định dạng JSON:
{
  "example": "..." // Bạn cần đưa ra ví dụ tiếng anh với từ và nghĩa đã cho của nó. 
  "vietnamese_meaning": "..." // nghĩa tiếng Việt ngắn gọn, tự nhiên cho ví dụ tiếng anh bạn đã cung cấp ở trên
}
Tránh trả về triple backticks.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    try {
      const content = response.choices[0].message.content;

      const data = JSON.parse(content ?? '');
      return {
        vietnamese_meaning: data.vietnamese_meaning,
        example: data.example,
      };
    } catch (err) {
      console.error('Error generating json content:', err);
      return {
        vietnamese_meaning: null,
        example: null,
      };
    }
  }

  async getIPAandMeaning(word: string, example: string | null = null) {
    const prompt = `
Bạn là một trợ lý học tiếng Anh. Với từ/cụm từ sau: "${word}" và câu chứa từ này "${example || 'nil'}", hãy trả về kết quả ở định dạng JSON:
{
  "ipa": "...", // phiên âm quốc tế IPA
  "example": "..." // Nếu câu chứa từ đó là 'nil', bạn cần đưa ra ví dụ tiếng anh với từ đã cho. Ngược lại, chỉ cần trả về câu đó với chữ cái đầu viết hoa.
  "vietnamese_meaning": "..." // nghĩa tiếng Việt ngắn gọn, tự nhiên cho câu chứa từ đó. Nếu câu là 'nil', bạn cần đưa ra nghĩa của ví dụ tiếng anh bạn đã cung cấp ở trên
  "topic_name": "..." // tên của topic mà bạn nghĩ từ vựng này nên thuộc về, ví dụ: "basketball" thì thuộc topic "sports"
  "topic_description": "..." // miêu tả ngắn về topic
}
Tránh trả về triple backticks.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    try {
      const content = response.choices[0].message.content;

      const data = JSON.parse(content ?? '');
      return {
        ipa: data.ipa,
        vietnamese_meaning: data.vietnamese_meaning,
        example: data.example,
        topic_name: data.topic_name,
        topic_description: data.topic_description,
      };
    } catch (err) {
      console.error('Error generating json content:', err);
      return {
        ipa: null,
        vietnamese_meaning: null,
        example: null,
        topic_name: null,
        topic_description: null,
      };
    }
  }

  async generateAIGrammar(
    word: string,
    correctMeaning: string,
    example: string,
  ) {
    const prompt = `
Bạn là một trợ lý học tiếng Anh. Với từ/cụm từ sau: "${word}", nghĩa tiếng Việt của nó: "${correctMeaning}", và một ví dụ cơ bản: "${example}", hãy trả về kết quả ở định dạng markdown. Yêu cầu như sau:

- Mở đầu với tiêu đề: "Understanding ${word}." Sau đó giới thiệu về nó, sơ lược về các tình huống giao tiếp.
- Tiếp theo là mục: "Meaning". Sau đó giải nghĩa từ này.
- Tiếp theo là mục: "How to use it". Bạn đưa ra các trường hợp sử dụng.
- Tiếp theo là mục: "Example of usage": Bạn đưa ra các ví dụ tương ứng với các usecase ở mục How to use it.
- Cuối cùng là mục: "Synonyms". Sau đó đưa ra các từ đồng nghĩa.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const markdownOutput = completion.choices[0]?.message?.content || '';
      // card.grammar_markdown = markdownOutput;
      // await this.cardRepository.save(card);
      return {
        // card_id,
        grammar_markdown: markdownOutput,
      };
    } catch (error) {
      console.error('Error from OpenAI:', error);
      throw new Error('Failed to generate grammar explanation');
    }
  }

  async getSingleMeaning(word: string, cover_sentence: string) {
    const prompt = `
Bạn là một trợ lý học tiếng Anh. Với từ/cụm từ sau: "${word}" và ngữ cảnh của nó: "${cover_sentence}", hãy trả về kết quả ở định dạng JSON:
{
  "meaning": "..." // nghĩa tiếng Việt của từ đó
}
Tránh trả về triple backticks.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    try {
      const content = response.choices[0].message.content;
      const data = JSON.parse(content ?? '');
      return {
        meaning: data.meaning,
      };
    } catch (err) {
      console.error('Error generating json content:', err);
      return {
        meaning: null,
      };
    }
  }
}
