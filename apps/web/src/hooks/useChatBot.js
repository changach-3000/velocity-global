
import { useState, useCallback, useEffect } from 'react';
import { useChatBotContext } from '@/contexts/ChatBotContext.jsx';
import { useConversationContext } from '@/hooks/useConversationContext.js';
import { useSmartLeadCapture } from '@/hooks/useSmartLeadCapture.js';
import { findMatches } from '@/utils/semanticMatcher.js';
import { classifyIntent } from '@/utils/intentClassifier.js';
import { generateResponse, generateFallbackResponse } from '@/utils/responseGenerator.js';
import pb from '@/lib/pocketbaseClient';

export const useChatBot = () => {
  const {
    isOpen,
    toggleChat,
    messages,
    addMessage,
    isLoading,
    setIsLoading,
    resetChat: resetUI
  } = useChatBotContext();

  const { context, updateContext, resetContext } = useConversationContext();
  const { 
    checkLeadCaptureTiming, 
    shouldShowPrompt, 
    dismissPrompt, 
    markLeadCaptured 
  } = useSmartLeadCapture();

  // Effect to handle lead prompt triggering
  useEffect(() => {
    if (shouldShowPrompt) {
      // Check if the last message is already a prompt to avoid duplicates
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.type !== 'lead-prompt') {
        addMessage({
          text: null, // No text, just the component
          sender: 'bot',
          type: 'lead-prompt'
        });
      }
    }
  }, [shouldShowPrompt, messages, addMessage]);

  const handleUserMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // 1. Add User Message
    addMessage({ text, sender: 'user' });
    setIsLoading(true);

    // 2. Analyze Intent
    const intentData = classifyIntent(text);
    updateContext({ 
      lastIntent: intentData.type,
      topic: intentData.type 
    });

    // Simulate network delay for "thinking"
    setTimeout(async () => {
      try {
        // 3. Semantic Matching
        const matches = findMatches(text);
        const bestMatch = matches[0];

        // 4. Response Generation Logic
        if (bestMatch && bestMatch.score > 0.65) {
          // High Confidence Match
          const response = generateResponse(bestMatch, context);
          addMessage({ 
            text: response.text, 
            prefix: response.prefix,
            suggestions: response.suggestions,
            sender: 'bot' 
          });
          
          // Check for lead capture opportunity
          checkLeadCaptureTiming(intentData.type, intentData.isGenuineInterest);

        } else if (bestMatch && bestMatch.score > 0.4) {
          // Medium Confidence - Clarification Needed
          addMessage({
            text: "I'm not 100% sure, but I found a few things that might help. Are you asking about:",
            sender: 'bot',
            type: 'clarification',
            options: matches.slice(0, 3).map(m => ({ id: m.faq.id, text: m.faq.question }))
          });

        } else {
          // Low Confidence - Fallback
          const fallback = generateFallbackResponse();
          addMessage({ 
            text: fallback.text, 
            prefix: fallback.prefix,
            suggestions: fallback.suggestions,
            sender: 'bot' 
          });
        }

      } catch (error) {
        console.error("ChatBot Error:", error);
        addMessage({ text: "I'm having a bit of trouble connecting right now. Please try again later.", sender: 'bot' });
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [addMessage, setIsLoading, context, updateContext, checkLeadCaptureTiming]);

  const saveLead = useCallback(async (leadData) => {
    try {
      const history = JSON.stringify(messages.map(m => ({
        sender: m.sender,
        text: m.text,
        time: m.timestamp
      })));

      const data = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        conversation_history: history
      };

      await pb.collection('leads').create(data);
      markLeadCaptured();
      return { success: true };
    } catch (error) {
      console.error("Error saving lead:", error);
      return { success: false, error: error.message };
    }
  }, [messages, markLeadCaptured]);

  const resetChat = useCallback(() => {
    resetUI();
    resetContext();
  }, [resetUI, resetContext]);

  return {
    isOpen,
    toggleChat,
    messages,
    isLoading,
    handleUserMessage,
    saveLead,
    resetChat
  };
};
