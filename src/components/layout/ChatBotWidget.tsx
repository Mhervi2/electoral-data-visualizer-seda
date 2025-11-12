import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ChatBotWidget = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
            asChild
          >
            <a
              href="https://notebooklm.google.com/notebook/2ef71af6-87be-4b3f-85d7-c65dab937ae1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Asistente Virtual"
            >
              <MessageCircle className="h-6 w-6" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Asistente Virtual</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChatBotWidget;
