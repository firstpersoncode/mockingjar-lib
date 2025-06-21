import Anthropic from '@anthropic-ai/sdk';

export const createAnthropicClient = (anthropicKey: string) => {
  if (!anthropicKey) {
    throw new Error('Anthropic API key is required');
  }

  return new Anthropic({
    apiKey: anthropicKey,
  });
};
