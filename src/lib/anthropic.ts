import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set - Claude features will be disabled');
}

export const anthropic = new Anthropic({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: false,
});

export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
export const DEFAULT_MAX_TOKENS = 4096;

export type StreamCallback = (text: string) => void;

export interface StreamOptions {
  onText?: StreamCallback;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream a message from Claude with optional callbacks
 */
export async function streamMessage(
  messages: Anthropic.MessageParam[],
  options: StreamOptions = {}
): Promise<string> {
  const { onText, onComplete, onError } = options;

  try {
    const stream = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages,
      stream: true,
    });

    let fullText = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        onText?.(text);
      }
    }

    onComplete?.(fullText);
    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

/**
 * Non-streaming message for simple requests
 */
export async function sendMessage(
  messages: Anthropic.MessageParam[]
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages,
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return textBlocks.map((block) => block.text).join('\n');
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}
