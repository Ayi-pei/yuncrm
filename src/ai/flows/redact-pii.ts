'use server';

/**
 * @fileOverview Redacts PII from customer messages using an AI model.
 *
 * - redactPii - A function that redacts PII from customer messages.
 * - RedactPiiInput - The input type for the redactPii function.
 * - RedactPiiOutput - The return type for the redactPii function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RedactPiiInputSchema = z.object({
  message: z.string().describe('The customer message to redact PII from.'),
});
export type RedactPiiInput = z.infer<typeof RedactPiiInputSchema>;

const RedactPiiOutputSchema = z.object({
  redactedMessage: z.string().describe('The message with PII redacted.'),
});
export type RedactPiiOutput = z.infer<typeof RedactPiiOutputSchema>;

export async function redactPii(input: RedactPiiInput): Promise<RedactPiiOutput> {
  return redactPiiFlow(input);
}

const redactPiiPrompt = ai.definePrompt({
  name: 'redactPiiPrompt',
  input: {schema: RedactPiiInputSchema},
  output: {schema: RedactPiiOutputSchema},
  prompt: `You are an AI assistant specializing in redacting personally identifiable information (PII) from customer messages.

  Your task is to analyze the given message and redact any PII, such as names, email addresses, phone numbers, social security numbers, credit card numbers, addresses, and other sensitive information.
  Replace the PII with a placeholder like "[REDACTED]" or a similar marker.

  Message: {{{message}}}
  `,
});

const redactPiiFlow = ai.defineFlow(
  {
    name: 'redactPiiFlow',
    inputSchema: RedactPiiInputSchema,
    outputSchema: RedactPiiOutputSchema,
  },
  async input => {
    const {output} = await redactPiiPrompt(input);
    return output!;
  }
);
