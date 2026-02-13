
import { faqs } from './faqKnowledgeBase.js';

/**
 * Generates a natural response based on the matched FAQ and context.
 */
export const generateResponse = (match, context = {}) => {
  const { faq, score } = match;
  const { userName } = context;

  // 1. Select base answer (detailed if high confidence, standard otherwise)
  let responseText = score > 0.6 ? faq.detailedAnswer : faq.answer;

  // 2. Add personalization if available
  const greeting = userName ? `${userName}, ` : '';
  
  // 3. Add transitional phrase based on context if needed
  let prefix = '';
  if (score > 0.8) {
    prefix = "Here is exactly what you need to know: ";
  } else if (score > 0.5) {
    prefix = "I think this might help: ";
  } else {
    prefix = "This seems relevant to your question: ";
  }

  // 4. Find related suggestions
  const relatedSuggestions = faq.relatedIds
    .map(id => faqs.find(f => f.id === id))
    .filter(Boolean)
    .map(f => ({ id: f.id, text: f.question }));

  return {
    text: responseText,
    prefix: greeting + prefix,
    suggestions: relatedSuggestions,
    confidence: score,
    faqId: faq.id
  };
};

export const generateFallbackResponse = () => {
  return {
    text: "I'm not entirely sure I understand that specific question. Could you rephrase it slightly? I'm best at answering questions about leasing terms, rates, and the application process.",
    prefix: "Hmm, ",
    suggestions: [
      { id: 'leasing-definition', text: "What is leasing?" },
      { id: 'apply-process', text: "How to apply?" },
      { id: 'interest-rates', text: "Current rates" }
    ],
    confidence: 0
  };
};
